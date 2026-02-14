import { create } from 'zustand';
import type { SocialAccount } from '@/types';

interface SyncResult {
  success: boolean;
  synced?: number;
  error?: string;
}

interface SocialState {
  accounts: SocialAccount[];
  loading: boolean;
  syncingId: string | null;

  fetchAccounts: () => Promise<void>;
  syncAccount: (id: string, platform: string) => Promise<SyncResult>;
  disconnectAccount: (id: string) => Promise<boolean>;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  accounts: [],
  loading: false,
  syncingId: null,

  fetchAccounts: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/social/accounts');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      const accounts = (await res.json()) as SocialAccount[];
      set({ accounts, loading: false });
    } catch (error) {
      console.error(
        'Failed to fetch social accounts:',
        error instanceof Error ? error.message : 'Unknown'
      );
      set({ loading: false });
    }
  },

  syncAccount: async (id, platform) => {
    set({ syncingId: id });
    try {
      const res = await fetch(`/api/social/${platform}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: id }),
      });

      const data = (await res.json()) as { synced?: number; error?: string };

      if (!res.ok) {
        set({ syncingId: null });
        return { success: false, error: data.error || 'Erro ao sincronizar' };
      }

      // Refresh accounts to get updated lastSyncAt
      await get().fetchAccounts();
      set({ syncingId: null });
      return { success: true, synced: data.synced };
    } catch (error) {
      console.error(
        'Failed to sync account:',
        error instanceof Error ? error.message : 'Unknown'
      );
      set({ syncingId: null });
      return { success: false, error: 'Erro ao sincronizar' };
    }
  },

  disconnectAccount: async (id) => {
    try {
      const res = await fetch(`/api/social/accounts?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) return false;

      set((state) => ({
        accounts: state.accounts.filter((a) => a.id !== id),
      }));
      return true;
    } catch (error) {
      console.error(
        'Failed to disconnect account:',
        error instanceof Error ? error.message : 'Unknown'
      );
      return false;
    }
  },
}));
