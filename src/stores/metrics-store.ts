import { create } from 'zustand';
import type { PostMetrics, AggregatedMetrics } from '@/types';

interface MetricsState {
  metrics: PostMetrics[];
  aggregated: AggregatedMetrics | null;
  loading: boolean;
  loadingAggregated: boolean;
  total: number;
  dateRange: { from: string; to: string };

  fetchMetrics: (params?: {
    platform?: string;
    accountId?: string;
    limit?: number;
    offset?: number;
  }) => Promise<void>;
  fetchAggregated: (from?: string, to?: string) => Promise<void>;
  setDateRange: (from: string, to: string) => void;
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
  from.setDate(from.getDate() - 30);
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

  fetchMetrics: async (params) => {
    set({ loading: true });
    try {
      const { dateRange } = get();
      const query = new URLSearchParams();
      query.set('from', dateRange.from);
      query.set('to', dateRange.to);
      if (params?.platform) query.set('platform', params.platform);
      if (params?.accountId) query.set('accountId', params.accountId);
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

  fetchAggregated: async (from?: string, to?: string) => {
    set({ loadingAggregated: true });
    try {
      const { dateRange } = get();
      const queryFrom = from || dateRange.from;
      const queryTo = to || dateRange.to;

      const query = new URLSearchParams();
      query.set('from', queryFrom);
      query.set('to', queryTo);

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
}));
