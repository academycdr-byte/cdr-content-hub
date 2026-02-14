/**
 * Cron endpoint: Sync all active social accounts.
 *
 * Called by Vercel Cron every 15 minutes.
 * Protected with CRON_SECRET header validation.
 *
 * Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
 *
 * Timeout: 55 seconds (Vercel Pro = 60s max, leaving 5s buffer).
 *
 * TODO: [v2] Add Instagram Meta Webhooks (requires App Review + HTTPS callback).
 * TODO: [v2] Add TikTok Webhooks (requires TikTok Developer Portal config).
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncAllAccounts } from '@/lib/sync/sync-all';

/** Maximum execution time in ms (55s, leaving 5s buffer for Vercel 60s limit). */
const MAX_EXECUTION_MS = 55_000;

export async function GET(request: NextRequest) {
  const start = Date.now();

  // 1. Validate CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Cron Sync] CRON_SECRET not configured');
    return NextResponse.json(
      { error: 'Server misconfiguration: CRON_SECRET not set' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[Cron Sync] Unauthorized attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Run sync with timeout protection
    const syncPromise = syncAllAccounts('cron');
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Cron sync timeout (55s)')), MAX_EXECUTION_MS);
    });

    const summary = await Promise.race([syncPromise, timeoutPromise]);

    console.log(
      `[Cron Sync] Done: ${summary.total} accounts, ${summary.synced} synced, ${summary.failed} failed, ${Date.now() - start}ms`
    );

    return NextResponse.json({
      ok: true,
      total: summary.total,
      synced: summary.synced,
      failed: summary.failed,
      durationMs: summary.durationMs,
      errors: summary.results
        .filter((r) => r.status === 'error')
        .map((r) => ({
          accountId: r.accountId,
          platform: r.platform,
          error: r.errorMessage,
        })),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Cron Sync] Fatal error:', errorMessage);

    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
        durationMs: Date.now() - start,
      },
      { status: 500 }
    );
  }
}
