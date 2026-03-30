import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const userId = auth.session!.user.id;

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get all active accounts for this user
    const accounts = await prisma.socialAccount.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        username: true,
        displayName: true,
        platform: true,
        followersCount: true,
      },
    });

    if (accounts.length === 0) {
      return NextResponse.json({ accounts: [], series: [] });
    }

    const accountIds = accounts.map((a) => a.id);

    // Get all snapshots for these accounts in the time range
    const snapshots = await prisma.followerSnapshot.findMany({
      where: {
        socialAccountId: { in: accountIds },
        snapshotDate: { gte: since },
      },
      orderBy: { snapshotDate: 'asc' },
      select: {
        socialAccountId: true,
        followersCount: true,
        snapshotDate: true,
      },
    });

    // Group snapshots by date, with one column per account
    const dateMap = new Map<string, Record<string, number>>();

    for (const snap of snapshots) {
      const dateKey = snap.snapshotDate.toISOString().split('T')[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {});
      }
      dateMap.get(dateKey)![snap.socialAccountId] = snap.followersCount;
    }

    // Add today's data from current follower count if not already present
    const today = new Date().toISOString().split('T')[0];
    if (!dateMap.has(today)) {
      dateMap.set(today, {});
    }
    for (const acc of accounts) {
      if (!dateMap.get(today)![acc.id] && acc.followersCount > 0) {
        dateMap.get(today)![acc.id] = acc.followersCount;
      }
    }

    // Build series sorted by date
    const sortedDates = Array.from(dateMap.keys()).sort();
    const series = sortedDates.map((date) => {
      const entry: Record<string, string | number> = { date };
      for (const acc of accounts) {
        entry[acc.id] = dateMap.get(date)?.[acc.id] || 0;
      }
      return entry;
    });

    // Fill gaps: for each account, carry forward the last known value
    for (const acc of accounts) {
      let lastKnown = 0;
      for (const point of series) {
        if ((point[acc.id] as number) > 0) {
          lastKnown = point[acc.id] as number;
        } else if (lastKnown > 0) {
          point[acc.id] = lastKnown;
        }
      }
    }

    return NextResponse.json({
      accounts: accounts.map((a) => ({
        id: a.id,
        username: a.username,
        displayName: a.displayName,
        platform: a.platform,
        currentFollowers: a.followersCount,
      })),
      series,
    });
  } catch (error) {
    console.error('Failed to fetch follower evolution:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to fetch follower evolution' },
      { status: 500 }
    );
  }
}
