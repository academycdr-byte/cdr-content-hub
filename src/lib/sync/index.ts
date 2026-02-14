/**
 * Sync module barrel export.
 *
 * Provides unified access to all sync functionality.
 */

export { syncInstagramAccount } from '@/lib/sync/instagram-sync';
export { syncTikTokAccount } from '@/lib/sync/tiktok-sync';
export { syncAllAccounts } from '@/lib/sync/sync-all';
export type { SyncResult, SyncAllSummary, SyncTrigger, SyncStatus } from '@/lib/sync/types';
