/**
 * Reusable Instagram sync logic.
 *
 * Extracted from the manual sync route so it can be called by:
 * - Manual sync endpoint (POST /api/social/instagram/sync)
 * - Cron sync-all endpoint (GET /api/cron/sync-all)
 * - Future webhook handler
 */

import { fetchInstagramMedia, refreshLongLivedToken } from '@/lib/instagram';
import { prisma } from '@/lib/prisma';
import { generateId } from '@/lib/utils';
import type { SyncResult, SyncTrigger } from '@/lib/sync/types';

interface InstagramAccount {
  id: string;
  username: string;
  igUserId: string | null;
  accessToken: string | null;
  tokenExpiresAt: Date | null;
}

/**
 * Sync a single Instagram account.
 *
 * Handles token auto-refresh, fetches media, upserts PostMetrics,
 * updates lastSyncAt, and creates a SyncLog entry.
 *
 * @throws Never -- errors are captured in the returned SyncResult.
 */
export async function syncInstagramAccount(
  account: InstagramAccount,
  trigger: SyncTrigger
): Promise<SyncResult> {
  const start = Date.now();

  if (!account.igUserId || !account.accessToken) {
    const result: SyncResult = {
      accountId: account.id,
      platform: 'instagram',
      postsFound: 0,
      postsSynced: 0,
      status: 'error',
      errorMessage: 'Conta sem igUserId ou accessToken',
      durationMs: Date.now() - start,
    };
    await logSync(result, trigger);
    return result;
  }

  try {
    // 1. Token auto-refresh (< 7 days remaining)
    let accessToken = account.accessToken;
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    if (account.tokenExpiresAt && account.tokenExpiresAt < sevenDaysFromNow) {
      console.log(`[IG Sync] Token expiring/expired for @${account.username}, refreshing...`);

      // If already expired, cannot refresh
      if (account.tokenExpiresAt < new Date()) {
        const result: SyncResult = {
          accountId: account.id,
          platform: 'instagram',
          postsFound: 0,
          postsSynced: 0,
          status: 'error',
          errorMessage: 'Token expirado - precisa reconectar',
          durationMs: Date.now() - start,
        };
        await logSync(result, trigger);
        return result;
      }

      const refreshed = await refreshLongLivedToken(account.accessToken);
      accessToken = refreshed.access_token;
      const newExpiresAt = new Date();
      newExpiresAt.setSeconds(newExpiresAt.getSeconds() + refreshed.expires_in);

      await prisma.socialAccount.update({
        where: { id: account.id },
        data: { accessToken, tokenExpiresAt: newExpiresAt },
      });
      console.log(`[IG Sync] Token renewed for @${account.username} - expires: ${newExpiresAt.toISOString()}`);
    }

    // 2. Fetch posts from Instagram
    const posts = await fetchInstagramMedia(accessToken, account.igUserId);

    // 3. Upsert PostMetrics
    let postsSynced = 0;
    for (const post of posts) {
      const publishedAt = new Date(post.postedAt);
      if (isNaN(publishedAt.getTime())) {
        console.warn(`[IG Sync] Invalid timestamp for post ${post.externalId}: "${post.postedAt}" - skipping`);
        continue;
      }

      await prisma.postMetrics.upsert({
        where: { externalId: post.externalId },
        update: {
          views: post.views,
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          postUrl: post.url,
          thumbnailUrl: post.thumbnailUrl,
          caption: post.title,
          mediaType: post.mediaType,
          publishedAt,
          syncedAt: new Date(),
        },
        create: {
          id: generateId(),
          socialAccountId: account.id,
          externalId: post.externalId,
          platform: 'instagram',
          views: post.views,
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          postUrl: post.url,
          thumbnailUrl: post.thumbnailUrl,
          caption: post.title,
          mediaType: post.mediaType,
          publishedAt,
        },
      });
      postsSynced++;
    }

    // 4. Update lastSyncAt
    await prisma.socialAccount.update({
      where: { id: account.id },
      data: { lastSyncAt: new Date() },
    });

    console.log(`[IG Sync] @${account.username}: ${posts.length} posts found, ${postsSynced} synced (trigger: ${trigger})`);

    const result: SyncResult = {
      accountId: account.id,
      platform: 'instagram',
      postsFound: posts.length,
      postsSynced,
      status: postsSynced === posts.length ? 'success' : 'partial',
      errorMessage: null,
      durationMs: Date.now() - start,
    };
    await logSync(result, trigger);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[IG Sync] Error for @${account.username}:`, errorMessage);

    const result: SyncResult = {
      accountId: account.id,
      platform: 'instagram',
      postsFound: 0,
      postsSynced: 0,
      status: 'error',
      errorMessage,
      durationMs: Date.now() - start,
    };
    await logSync(result, trigger);
    return result;
  }
}

/**
 * Persist a SyncLog entry to the database.
 */
async function logSync(result: SyncResult, trigger: SyncTrigger): Promise<void> {
  try {
    await prisma.syncLog.create({
      data: {
        id: generateId(),
        accountId: result.accountId,
        platform: result.platform,
        trigger,
        postsFound: result.postsFound,
        postsSynced: result.postsSynced,
        status: result.status,
        errorMessage: result.errorMessage,
        duration: result.durationMs,
      },
    });
  } catch (logError) {
    // Never let logging failures break the sync flow
    console.error('[SyncLog] Failed to persist log:', logError instanceof Error ? logError.message : 'Unknown');
  }
}
