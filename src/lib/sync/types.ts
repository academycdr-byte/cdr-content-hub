/**
 * Shared types for the sync system.
 *
 * Used by instagram-sync, tiktok-sync, sync-all, and the cron endpoint.
 */

import type {
  SocialPlatform as PrismaSocialPlatform,
  SyncTrigger as PrismaSyncTrigger,
  SyncStatus as PrismaSyncStatus,
} from '@prisma/client';

export type SyncTrigger = PrismaSyncTrigger;
export type SyncStatus = PrismaSyncStatus;
export type SyncPlatform = PrismaSocialPlatform;

export interface SyncResult {
  accountId: string;
  platform: SyncPlatform;
  postsFound: number;
  postsSynced: number;
  status: SyncStatus;
  errorMessage: string | null;
  durationMs: number;
}

export interface SyncAllSummary {
  total: number;
  synced: number;
  failed: number;
  results: SyncResult[];
  durationMs: number;
}
