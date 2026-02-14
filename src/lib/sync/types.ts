/**
 * Shared types for the sync system.
 *
 * Used by instagram-sync, tiktok-sync, sync-all, and the cron endpoint.
 */

export type SyncTrigger = 'cron' | 'webhook' | 'manual';

export type SyncStatus = 'success' | 'error' | 'partial';

export interface SyncResult {
  accountId: string;
  platform: string;
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
