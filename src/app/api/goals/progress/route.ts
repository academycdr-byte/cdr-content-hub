import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const userId = auth.session!.user.id;

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const days = parseInt(searchParams.get('days') || '90', 10);

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId e obrigatorio' },
        { status: 400 }
      );
    }

    // Verify account belongs to user
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
      select: { userId: true },
    });
    if (!account || account.userId !== userId) {
      return NextResponse.json(
        { error: 'Conta nao encontrada' },
        { status: 404 }
      );
    }

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Fetch snapshots for the time period
    const snapshots = await prisma.followerSnapshot.findMany({
      where: {
        socialAccountId: accountId,
        snapshotDate: { gte: since },
      },
      orderBy: { snapshotDate: 'asc' },
      select: {
        followersCount: true,
        snapshotDate: true,
      },
    });

    // If no snapshots exist, include current follower count as today's data point
    if (snapshots.length === 0) {
      const accountData = await prisma.socialAccount.findUnique({
        where: { id: accountId },
        select: { followersCount: true },
      });
      if (accountData && accountData.followersCount > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        snapshots.push({
          followersCount: accountData.followersCount,
          snapshotDate: today,
        });
      }
    }

    // Fetch active goals for this account to include target line
    const goals = await prisma.goal.findMany({
      where: {
        socialAccountId: accountId,
        status: 'active',
        metricType: 'followers',
      },
      select: {
        id: true,
        targetValue: true,
        startValue: true,
        startDate: true,
        endDate: true,
      },
    });

    // Format snapshots for chart consumption
    const series = snapshots.map((s) => ({
      date: s.snapshotDate.toISOString().split('T')[0],
      followers: s.followersCount,
    }));

    // Format goal targets for reference lines
    const targets = goals.map((g) => ({
      goalId: g.id,
      targetValue: g.targetValue,
      startValue: g.startValue,
      startDate: g.startDate.toISOString().split('T')[0],
      endDate: g.endDate.toISOString().split('T')[0],
    }));

    return NextResponse.json({ series, targets });
  } catch (error) {
    console.error('Failed to fetch goal progress:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to fetch goal progress' },
      { status: 500 }
    );
  }
}
