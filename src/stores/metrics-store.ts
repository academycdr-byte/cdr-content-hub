import { create } from 'zustand';
import type { PostMetrics, AggregatedMetrics } from '@/types';

interface MetricsFilters {
  platform?: string;
  accountId?: string;
}

interface MetricsState {
  metrics: PostMetrics[];
  aggregated: AggregatedMetrics | null;
  loading: boolean;
  loadingAggregated: boolean;
  total: number;
  dateRange: { from: string; to: string };
  filters: MetricsFilters;

  fetchMetrics: (params?: {
    platform?: string;
    accountId?: string;
    limit?: number;
    offset?: number;
  }) => Promise<void>;
  fetchAggregated: (params?: {
    from?: string;
    to?: string;
    platform?: string;
    accountId?: string;
  }) => Promise<void>;
  setDateRange: (from: string, to: string) => void;
  setFilters: (filters: MetricsFilters) => void;
}

/** Format date as YYYY-MM-DD in user's local timezone */
function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return {
    from: toLocalDateString(from),
    to: toLocalDateString(to),
  };
}

export const useMetricsStore = create<MetricsState>((set, get) => ({
  metrics: [],
  aggregated: null,
  loading: false,
  loadingAggregated: false,
  total: 0,
  dateRange: getDefaultDateRange(),
  filters: {},

  fetchMetrics: async (params) => {
    set({ loading: true });
    try {
      const { dateRange, filters } = get();
      const query = new URLSearchParams();
      query.set('from', dateRange.from);
      query.set('to', dateRange.to);

      const platform = params?.platform ?? filters.platform;
      const accountId = params?.accountId ?? filters.accountId;
      if (platform) query.set('platform', platform);
      if (accountId) query.set('accountId', accountId);
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.offset) query.set('offset', String(params.offset));

      const res = await fetch(`/api/metrics?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch metrics');

      const data = (await res.json()) as {
        data: PostMetrics[];
        total: number;
      };
      set({ metrics: data.data, total: data.total, loading: false });
    } catch (error) {
      console.error(
        'Failed to fetch metrics:',
        error instanceof Error ? error.message : 'Unknown'
      );
      set({ loading: false });
    }
  },

  fetchAggregated: async (params) => {
    set({ loadingAggregated: true });
    try {
      const { dateRange, filters } = get();
      const queryFrom = params?.from || dateRange.from;
      const queryTo = params?.to || dateRange.to;

      const query = new URLSearchParams();
      query.set('from', queryFrom);
      query.set('to', queryTo);

      const platform = params?.platform ?? filters.platform;
      const accountId = params?.accountId ?? filters.accountId;
      if (platform) query.set('platform', platform);
      if (accountId) query.set('accountId', accountId);

      const res = await fetch(`/api/metrics/aggregate?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch aggregated metrics');

      const data = (await res.json()) as AggregatedMetrics;
      set({ aggregated: data, loadingAggregated: false });
    } catch (error) {
      console.error(
        'Failed to fetch aggregated metrics:',
        error instanceof Error ? error.message : 'Unknown'
      );
      set({ loadingAggregated: false });
    }
  },

  setDateRange: (from: string, to: string) => {
    set({ dateRange: { from, to } });
  },

  setFilters: (filters: MetricsFilters) => {
    set({ filters });
  },
}));
