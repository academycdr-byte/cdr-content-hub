import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { refreshLongLivedToken } from '@/lib/instagram';

/**
 * POST /api/social/refresh
 *
 * Refreshes Instagram tokens that are expiring within 7 days.
 * Should be called silently when user accesses metrics or social pages.
 *
 * Instagram long-lived tokens last 60 days and can be refreshed
 * as long as they haven't expired yet.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    // Find Instagram accounts with tokens expiring within 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringAccounts = await prisma.socialAccount.findMany({
      where: {
        userId,
        platform: 'instagram',
        isActive: true,
        accessToken: { not: null },
        tokenExpiresAt: {
          not: null,
          lt: sevenDaysFromNow,
        },
      },
    });

    let refreshed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const account of expiringAccounts) {
      // Skip already expired tokens -- they can't be refreshed
      const expiresAt = account.tokenExpiresAt ? new Date(account.tokenExpiresAt) : null;
      if (expiresAt && expiresAt < new Date()) {
        errors.push(`${account.username}: token already expired, needs reconnection`);
        failed++;
        continue;
      }

      try {
        const result = await refreshLongLivedToken(account.accessToken!);

        // Calculate new expiry date
        const newExpiresAt = new Date();
        newExpiresAt.setSeconds(newExpiresAt.getSeconds() + result.expires_in);

        await prisma.socialAccount.update({
          where: { id: account.id },
          data: {
            accessToken: result.access_token,
            tokenExpiresAt: newExpiresAt,
          },
        });

        refreshed++;
        console.log(
          `[Token Refresh] Renewed token for @${account.username} - new expiry: ${newExpiresAt.toISOString()}`
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${account.username}: ${msg}`);
        failed++;
        console.error(`[Token Refresh] Failed for @${account.username}:`, msg);
      }
    }

    return NextResponse.json({
      refreshed,
      failed,
      total: expiringAccounts.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] token refresh error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
