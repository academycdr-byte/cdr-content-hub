import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const userId = auth.session!.user.id;

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

    // Auto-snapshot today for all accounts (upsert)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const acc of accounts) {
      if (acc.followersCount > 0) {
        await prisma.followerSnapshot.upsert({
          where: {
            socialAccountId_snapshotDate: {
              socialAccountId: acc.id,
              snapshotDate: today,
            },
          },
          update: { followersCount: acc.followersCount },
          create: {
            socialAccountId: acc.id,
            followersCount: acc.followersCount,
            snapshotDate: today,
          },
        });
      }
    }

    // Get ALL snapshots for these accounts (no date filter — full history)
    const snapshots = await prisma.followerSnapshot.findMany({
      where: {
        socialAccountId: { in: accountIds },
      },
      orderBy: { snapshotDate: 'asc' },
      select: {
        socialAccountId: true,
        followersCount: true,
        snapshotDate: true,
      },
    });

    // Build username map: accountId -> @username
    const usernameMap = new Map<string, string>();
    for (const acc of accounts) {
      usernameMap.set(acc.id, `@${acc.username}`);
    }

    // Group snapshots by date, keyed by @username
    const dateMap = new Map<string, Record<string, number>>();

    for (const snap of snapshots) {
      const dateKey = snap.snapshotDate.toISOString().split('T')[0];
      const username = usernameMap.get(snap.socialAccountId) || snap.socialAccountId;
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {});
      }
      dateMap.get(dateKey)![username] = snap.followersCount;
    }

    // Build series sorted by date
    const sortedDates = Array.from(dateMap.keys()).sort();
    const usernames = accounts.map((a) => `@${a.username}`);

    const series = sortedDates.map((date) => {
      const entry: Record<string, string | number> = { date };
      for (const uname of usernames) {
        entry[uname] = dateMap.get(date)?.[uname] || 0;
      }
      return entry;
    });

    // Fill gaps: carry forward last known value per account
    for (const uname of usernames) {
      let lastKnown = 0;
      for (const point of series) {
        if ((point[uname] as number) > 0) {
          lastKnown = point[uname] as number;
        } else if (lastKnown > 0) {
          point[uname] = lastKnown;
        }
      }
    }

    return NextResponse.json({
      accounts: accounts.map((a) => ({
        id: a.id,
        key: `@${a.username}`,
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
