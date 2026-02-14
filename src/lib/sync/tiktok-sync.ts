/**
 * Reusable TikTok sync logic.
 *
 * Extracted from the manual sync route so it can be called by:
 * - Manual sync endpoint (POST /api/social/tiktok/sync)
 * - Cron sync-all endpoint (GET /api/cron/sync-all)
 * - Future webhook handler
 */

import { fetchTikTokVideos, refreshTikTokToken } from '@/lib/tiktok';
import { prisma } from '@/lib/prisma';
import { generateId } from '@/lib/utils';
import type { SyncResult, SyncTrigger } from '@/lib/sync/types';

interface TikTokAccount {
  id: string;
  username: string;
  tiktokOpenId: string | null;
  tiktokToken: string | null;
  tiktokRefresh: string | null;
  tiktokExpiresAt: Date | null;
}

/**
 * Sync a single TikTok account.
 *
 * Handles token auto-refresh, fetches videos, upserts PostMetrics,
 * updates lastSyncAt, and creates a SyncLog entry.
 *
 * @throws Never -- errors are captured in the returned SyncResult.
 */
export async function syncTikTokAccount(
  account: TikTokAccount,
  trigger: SyncTrigger
): Promise<SyncResult> {
  const start = Date.now();

  if (!account.tiktokOpenId || !account.tiktokToken) {
    const result: SyncResult = {
      accountId: account.id,
      platform: 'tiktok',
      postsFound: 0,
      postsSynced: 0,
      status: 'error',
      errorMessage: 'Conta sem tiktokOpenId ou tiktokToken',
      durationMs: Date.now() - start,
    };
    await logSync(result, trigger);
    return result;
  }

  try {
    // 1. Token auto-refresh if expired
    let accessToken = account.tiktokToken;
    if (
      account.tiktokExpiresAt &&
      account.tiktokExpiresAt < new Date() &&
      account.tiktokRefresh
    ) {
      console.log(`[TK Sync] Token expired for @${account.username}, refreshing...`);

      const refreshed = await refreshTikTokToken(account.tiktokRefresh);
      accessToken = refreshed.access_token;
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + refreshed.expires_in);

      await prisma.socialAccount.update({
        where: { id: account.id },
        data: {
          tiktokToken: refreshed.access_token,
          tiktokRefresh: refreshed.refresh_token,
          tiktokExpiresAt: expiresAt,
        },
      });
      console.log(`[TK Sync] Token renewed for @${account.username} - expires: ${expiresAt.toISOString()}`);
    }

    // If expired and no refresh token, fail gracefully
    if (
      account.tiktokExpiresAt &&
      account.tiktokExpiresAt < new Date() &&
      !account.tiktokRefresh
    ) {
      const result: SyncResult = {
        accountId: account.id,
        platform: 'tiktok',
        postsFound: 0,
        postsSynced: 0,
        status: 'error',
        errorMessage: 'Token expirado sem refresh token - precisa reconectar',
        durationMs: Date.now() - start,
      };
      await logSync(result, trigger);
      return result;
    }

    // 2. Fetch videos from TikTok
    const videos = await fetchTikTokVideos(accessToken);

    // 3. Upsert PostMetrics
    let postsSynced = 0;
    for (const video of videos) {
      const publishedAt = new Date(video.postedAt);
      if (isNaN(publishedAt.getTime())) {
        console.warn(`[TK Sync] Invalid timestamp for video ${video.externalId}: "${video.postedAt}" - skipping`);
        continue;
      }

      await prisma.postMetrics.upsert({
        where: { externalId: video.externalId },
        update: {
          views: video.views,
          likes: video.likes,
          comments: video.comments,
          shares: video.shares,
          postUrl: video.url,
          thumbnailUrl: video.thumbnailUrl,
          caption: video.title,
          mediaType: 'VIDEO',
          publishedAt,
          syncedAt: new Date(),
        },
        create: {
          id: generateId(),
          socialAccountId: account.id,
          externalId: video.externalId,
          platform: 'tiktok',
          views: video.views,
          likes: video.likes,
          comments: video.comments,
          shares: video.shares,
          postUrl: video.url,
          thumbnailUrl: video.thumbnailUrl,
          caption: video.title,
          mediaType: 'VIDEO',
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

    console.log(`[TK Sync] @${account.username}: ${videos.length} videos found, ${postsSynced} synced (trigger: ${trigger})`);

    const result: SyncResult = {
      accountId: account.id,
      platform: 'tiktok',
      postsFound: videos.length,
      postsSynced,
      status: postsSynced === videos.length ? 'success' : 'partial',
      errorMessage: null,
      durationMs: Date.now() - start,
    };
    await logSync(result, trigger);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[TK Sync] Error for @${account.username}:`, errorMessage);

    const result: SyncResult = {
      accountId: account.id,
      platform: 'tiktok',
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
