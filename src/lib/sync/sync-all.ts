/**
 * Sync all active social accounts.
 *
 * Used by the cron endpoint and can be called from any server context.
 * Each account is synced independently -- failure in one does NOT block others.
 *
 * TODO: [v2] Add webhook triggers for real-time sync (Instagram Meta Webhooks, TikTok Webhooks).
 */

import { prisma } from '@/lib/prisma';
import { syncInstagramAccount } from '@/lib/sync/instagram-sync';
import { syncTikTokAccount } from '@/lib/sync/tiktok-sync';
import type { SyncResult, SyncAllSummary, SyncTrigger } from '@/lib/sync/types';

/**
 * Sync all accounts with `isActive: true` and `autoSync: true`.
 *
 * Uses Promise.allSettled to ensure one failing account does not block others.
 * Logs all results and returns a summary.
 */
export async function syncAllAccounts(trigger: SyncTrigger = 'cron'): Promise<SyncAllSummary> {
  const start = Date.now();

  // Fetch all active accounts with autoSync enabled
  const accounts = await prisma.socialAccount.findMany({
    where: {
      isActive: true,
      autoSync: true,
    },
    select: {
      id: true,
      platform: true,
      username: true,
      igUserId: true,
      accessToken: true,
      tokenExpiresAt: true,
      tiktokOpenId: true,
      tiktokToken: true,
      tiktokRefresh: true,
      tiktokExpiresAt: true,
    },
  });

  if (accounts.length === 0) {
    console.log(`[Sync All] No active accounts with autoSync enabled (trigger: ${trigger})`);
    return {
      total: 0,
      synced: 0,
      failed: 0,
      results: [],
      durationMs: Date.now() - start,
    };
  }

  console.log(`[Sync All] Starting sync for ${accounts.length} accounts (trigger: ${trigger})`);

  // Run all syncs in parallel with Promise.allSettled
  const settledResults = await Promise.allSettled(
    accounts.map((account) => {
      if (account.platform === 'instagram') {
        return syncInstagramAccount(account, trigger);
      }
      if (account.platform === 'tiktok') {
        return syncTikTokAccount(account, trigger);
      }
      // Unknown platform -- return error result
      const errorResult: SyncResult = {
        accountId: account.id,
        platform: account.platform,
        postsFound: 0,
        postsSynced: 0,
        status: 'error',
        errorMessage: `Plataforma desconhecida: ${account.platform}`,
        durationMs: 0,
      };
      return Promise.resolve(errorResult);
    })
  );

  // Collect results
  const results: SyncResult[] = [];
  for (const settled of settledResults) {
    if (settled.status === 'fulfilled') {
      results.push(settled.value);
    } else {
      // This should rarely happen since sync functions catch their own errors,
      // but just in case there is an unexpected rejection.
      results.push({
        accountId: 'unknown',
        platform: 'unknown',
        postsFound: 0,
        postsSynced: 0,
        status: 'error',
        errorMessage: settled.reason instanceof Error ? settled.reason.message : 'Unexpected rejection',
        durationMs: 0,
      });
    }
  }

  const synced = results.filter((r) => r.status === 'success' || r.status === 'partial').length;
  const failed = results.filter((r) => r.status === 'error').length;

  const summary: SyncAllSummary = {
    total: accounts.length,
    synced,
    failed,
    results,
    durationMs: Date.now() - start,
  };

  console.log(
    `[Sync All] Completed: ${synced} synced, ${failed} failed, ${summary.durationMs}ms (trigger: ${trigger})`
  );

  return summary;
}
