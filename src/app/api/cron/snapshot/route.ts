/**
 * Cron endpoint: Daily follower snapshot + goal status update.
 *
 * Called by Vercel Cron once per day.
 * Protected with CRON_SECRET header validation.
 *
 * For each active SocialAccount:
 *   1. Saves a FollowerSnapshot with current followersCount
 *   2. Updates currentValue on active Goals
 *   3. Marks Goals that hit targetValue as "achieved"
 *   4. Marks Goals past endDate as "expired"
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // 1. Validate CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Cron Snapshot] CRON_SECRET not configured');
    return NextResponse.json(
      { error: 'Server misconfiguration: CRON_SECRET not set' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[Cron Snapshot] Unauthorized attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    // Truncate to date only for unique constraint
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 2. Get all active social accounts
    const accounts = await prisma.socialAccount.findMany({
      where: { isActive: true },
      select: { id: true, followersCount: true },
    });

    let snapshotsCreated = 0;
    let goalsAchieved = 0;
    let goalsExpired = 0;

    // 3. Create snapshots and update goals
    for (const account of accounts) {
      // Create daily snapshot (upsert to handle re-runs)
      try {
        await prisma.followerSnapshot.upsert({
          where: {
            socialAccountId_snapshotDate: {
              socialAccountId: account.id,
              snapshotDate: today,
            },
          },
          create: {
            socialAccountId: account.id,
            followersCount: account.followersCount,
            snapshotDate: today,
          },
          update: {
            followersCount: account.followersCount,
          },
        });
        snapshotsCreated++;
      } catch (snapshotError) {
        console.error(
          `[Cron Snapshot] Failed snapshot for ${account.id}:`,
          snapshotError instanceof Error ? snapshotError.message : 'Unknown'
        );
      }

      // Update currentValue on active goals for this account
      await prisma.goal.updateMany({
        where: {
          socialAccountId: account.id,
          status: 'active',
        },
        data: {
          currentValue: account.followersCount,
        },
      });

      // Mark goals as achieved (currentValue >= targetValue)
      const achieved = await prisma.goal.updateMany({
        where: {
          socialAccountId: account.id,
          status: 'active',
          targetValue: { lte: account.followersCount },
        },
        data: { status: 'achieved' },
      });
      goalsAchieved += achieved.count;
    }

    // 4. Mark expired goals (endDate past, still active)
    const expired = await prisma.goal.updateMany({
      where: {
        status: 'active',
        endDate: { lt: now },
      },
      data: { status: 'expired' },
    });
    goalsExpired = expired.count;

    console.log(
      `[Cron Snapshot] Done: ${snapshotsCreated} snapshots, ${goalsAchieved} achieved, ${goalsExpired} expired`
    );

    return NextResponse.json({
      ok: true,
      accounts: accounts.length,
      snapshotsCreated,
      goalsAchieved,
      goalsExpired,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Cron Snapshot] Fatal error:', errorMessage);

    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
