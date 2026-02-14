import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * Manual snapshot trigger - creates a FollowerSnapshot for all
 * active social accounts belonging to the authenticated user.
 * No CRON_SECRET needed - uses regular auth.
 */
export async function POST() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const userId = auth.session!.user.id;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const accounts = await prisma.socialAccount.findMany({
      where: { userId, isActive: true },
      select: { id: true, followersCount: true },
    });

    let created = 0;

    for (const account of accounts) {
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
        created++;
      } catch (err) {
        console.error(
          `[Snapshot] Failed for ${account.id}:`,
          err instanceof Error ? err.message : 'Unknown'
        );
      }
    }

    // Also update goal currentValues
    for (const account of accounts) {
      await prisma.goal.updateMany({
        where: { socialAccountId: account.id, status: 'active' },
        data: { currentValue: account.followersCount },
      });
    }

    return NextResponse.json({ ok: true, created, accounts: accounts.length });
  } catch (error) {
    console.error(
      '[Snapshot] Error:',
      error instanceof Error ? error.message : 'Unknown'
    );
    return NextResponse.json(
      { error: 'Failed to create snapshots' },
      { status: 500 }
    );
  }
}
