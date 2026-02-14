import { create } from 'zustand';
import type { CalendarEntry, CalendarApiResponse, SocialPlatform } from '@/types';

interface CalendarFilterAccount {
  id: string;
  platform: SocialPlatform;
  username: string;
  displayName: string;
}

interface CalendarState {
  calendarEntries: Record<string, CalendarEntry[]>;
  accounts: CalendarFilterAccount[];
  selectedPlatform: SocialPlatform | null;
  selectedAccountId: string | null;
  loading: boolean;

  fetchCalendarData: (year: number, month: number) => Promise<void>;
  setFilter: (platform: SocialPlatform | null, accountId?: string | null) => void;
  setPlatformFilter: (platform: SocialPlatform | null) => void;
  setAccountFilter: (accountId: string | null) => void;
  getEntriesForDate: (dateKey: string) => CalendarEntry[];
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  calendarEntries: {},
  accounts: [],
  selectedPlatform: null,
  selectedAccountId: null,
  loading: false,

  fetchCalendarData: async (year: number, month: number) => {
    const state = get();
    set({ loading: true });

    try {
      const params = new URLSearchParams({
        year: String(year),
        month: String(month + 1), // API expects 1-indexed month
      });

      if (state.selectedPlatform) {
        params.set('platform', state.selectedPlatform);
      }

      if (state.selectedAccountId) {
        params.set('accountId', state.selectedAccountId);
      }

      const res = await fetch(`/api/calendar?${params.toString()}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch calendar data: ${res.status}`);
      }

      const data = (await res.json()) as CalendarApiResponse;

      set({
        calendarEntries: data.entries,
        accounts: data.accounts,
        loading: false,
      });
    } catch (error) {
      console.error(
        'Failed to fetch calendar data:',
        error instanceof Error ? error.message : 'Unknown'
      );
      set({ loading: false });
    }
  },

  setFilter: (platform, accountId = null) => {
    set({ selectedPlatform: platform, selectedAccountId: accountId });
  },

  setPlatformFilter: (platform) => {
    set({ selectedPlatform: platform, selectedAccountId: null });
  },

  setAccountFilter: (accountId) => {
    set({ selectedAccountId: accountId });
  },

  getEntriesForDate: (dateKey: string) => {
    const state = get();
    return state.calendarEntries[dateKey] || [];
  },
}));
