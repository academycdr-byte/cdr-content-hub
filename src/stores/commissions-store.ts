import { create } from 'zustand';
import type { Commission, CommissionConfig, CommissionStats } from '@/types';

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

interface CommissionsState {
  commissions: Commission[];
  configs: CommissionConfig[];
  loading: boolean;
  loadingConfigs: boolean;
  month: string;
  stats: CommissionStats | null;

  fetchCommissions: (month?: string) => Promise<void>;
  fetchConfigs: () => Promise<void>;
  calculateMonth: (month: string) => Promise<{ created: number; total: number }>;
  markPaid: (id: string) => Promise<void>;
  markUnpaid: (id: string) => Promise<void>;
  markAllPaid: (userId: string, month: string) => Promise<void>;
  updateConfig: (format: string, cpmValue: number) => Promise<void>;
  setMonth: (month: string) => void;
}

export const useCommissionsStore = create<CommissionsState>((set, get) => ({
  commissions: [],
  configs: [],
  loading: false,
  loadingConfigs: false,
  month: getCurrentMonth(),
  stats: null,

  fetchCommissions: async (month?: string) => {
    set({ loading: true });
    try {
      const targetMonth = month || get().month;
      const res = await fetch(`/api/commissions?month=${targetMonth}`);
      if (!res.ok) throw new Error('Failed to fetch commissions');

      const data = await res.json();
      set({
        commissions: data.data,
        stats: data.stats,
        loading: false,
      });
    } catch (error) {
      console.error(
        'Failed to fetch commissions:',
        error instanceof Error ? error.message : 'Unknown'
      );
      set({ loading: false });
    }
  },

  fetchConfigs: async () => {
    set({ loadingConfigs: true });
    try {
      const res = await fetch('/api/commissions/configs');
      if (!res.ok) throw new Error('Failed to fetch configs');

      const data = await res.json();
      set({ configs: data, loadingConfigs: false });
    } catch (error) {
      console.error(
        'Failed to fetch configs:',
        error instanceof Error ? error.message : 'Unknown'
      );
      set({ loadingConfigs: false });
    }
  },

  calculateMonth: async (month: string) => {
    set({ loading: true });
    try {
      const res = await fetch('/api/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'calculate', month }),
      });
      if (!res.ok) throw new Error('Failed to calculate commissions');

      const result = await res.json();

      // Refresh commissions after calculation
      await get().fetchCommissions(month);
      return result;
    } catch (error) {
      console.error(
        'Failed to calculate commissions:',
        error instanceof Error ? error.message : 'Unknown'
      );
      set({ loading: false });
      return { created: 0, total: 0 };
    }
  },

  markPaid: async (id: string) => {
    try {
      const res = await fetch('/api/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_paid', id }),
      });
      if (!res.ok) throw new Error('Failed to mark paid');
      await get().fetchCommissions();
    } catch (error) {
      console.error(
        'Failed to mark paid:',
        error instanceof Error ? error.message : 'Unknown'
      );
    }
  },

  markUnpaid: async (id: string) => {
    try {
      const res = await fetch('/api/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_unpaid', id }),
      });
      if (!res.ok) throw new Error('Failed to mark unpaid');
      await get().fetchCommissions();
    } catch (error) {
      console.error(
        'Failed to mark unpaid:',
        error instanceof Error ? error.message : 'Unknown'
      );
    }
  },

  markAllPaid: async (userId: string, month: string) => {
    try {
      const res = await fetch('/api/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_paid', userId, month }),
      });
      if (!res.ok) throw new Error('Failed to mark all paid');
      await get().fetchCommissions();
    } catch (error) {
      console.error(
        'Failed to mark all paid:',
        error instanceof Error ? error.message : 'Unknown'
      );
    }
  },

  updateConfig: async (format: string, cpmValue: number) => {
    try {
      const res = await fetch('/api/commissions/configs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, cpmValue }),
      });
      if (!res.ok) throw new Error('Failed to update config');
      await get().fetchConfigs();
    } catch (error) {
      console.error(
        'Failed to update config:',
        error instanceof Error ? error.message : 'Unknown'
      );
    }
  },

  setMonth: (month: string) => {
    set({ month });
  },
}));
