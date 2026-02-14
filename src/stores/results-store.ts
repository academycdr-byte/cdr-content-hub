import { create } from 'zustand';
import type { ClientResult } from '@/types';

interface ResultsFilters {
  clientName: string;
  metricType: string;
  clientNiche: string;
}

interface ResultsState {
  results: ClientResult[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  filters: ResultsFilters;

  setFilters: (filters: Partial<ResultsFilters>) => void;
  setPage: (page: number) => void;
  fetchResults: () => Promise<void>;
  createResult: (data: CreateResultInput) => Promise<ClientResult | null>;
  updateResult: (id: string, data: UpdateResultInput) => Promise<ClientResult | null>;
  deleteResult: (id: string) => Promise<boolean>;
}

interface CreateResultInput {
  clientName: string;
  clientNiche: string;
  metricType: string;
  metricValue: string;
  metricUnit?: string;
  period: string;
  description?: string;
  testimonialText?: string;
  imageUrls?: { url: string; altText?: string; type?: string }[];
}

interface UpdateResultInput {
  clientName?: string;
  clientNiche?: string;
  metricType?: string;
  metricValue?: string;
  metricUnit?: string;
  period?: string;
  description?: string;
  testimonialText?: string | null;
  imageUrls?: { url: string; altText?: string; type?: string }[];
}

interface ResultsApiResponse {
  results: ClientResult[];
  total: number;
  page: number;
  totalPages: number;
}

export const useResultsStore = create<ResultsState>((set, get) => ({
  results: [],
  loading: false,
  page: 1,
  totalPages: 1,
  total: 0,
  filters: {
    clientName: '',
    metricType: '',
    clientNiche: '',
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      page: 1,
    }));
    get().fetchResults();
  },

  setPage: (page) => {
    set({ page });
    get().fetchResults();
  },

  fetchResults: async () => {
    set({ loading: true });
    try {
      const { page, filters } = get();
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');

      if (filters.clientName) params.set('clientName', filters.clientName);
      if (filters.metricType) params.set('metricType', filters.metricType);
      if (filters.clientNiche) params.set('clientNiche', filters.clientNiche);

      const res = await fetch(`/api/results?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch results');

      const data = await res.json() as ResultsApiResponse;
      set({
        results: data.results,
        total: data.total,
        totalPages: data.totalPages,
        page: data.page,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to fetch results:', error instanceof Error ? error.message : 'Unknown');
      set({ loading: false });
    }
  },

  createResult: async (data) => {
    try {
      const res = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to create result');

      const result = await res.json() as ClientResult;
      get().fetchResults();
      return result;
    } catch (error) {
      console.error('Failed to create result:', error instanceof Error ? error.message : 'Unknown');
      return null;
    }
  },

  updateResult: async (id, data) => {
    try {
      const res = await fetch(`/api/results/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to update result');

      const result = await res.json() as ClientResult;
      get().fetchResults();
      return result;
    } catch (error) {
      console.error('Failed to update result:', error instanceof Error ? error.message : 'Unknown');
      return null;
    }
  },

  deleteResult: async (id) => {
    try {
      const res = await fetch(`/api/results/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete result');

      get().fetchResults();
      return true;
    } catch (error) {
      console.error('Failed to delete result:', error instanceof Error ? error.message : 'Unknown');
      return false;
    }
  },
}));
