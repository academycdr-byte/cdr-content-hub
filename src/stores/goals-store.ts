import { create } from 'zustand';
import type { GoalWithProgress, FollowerSnapshot } from '@/types';

interface CreateGoalData {
  socialAccountId: string;
  metricType?: string;
  targetValue: number;
  period: string;
  endDate: string;
}

interface UpdateGoalData {
  targetValue?: number;
  period?: string;
  endDate?: string;
  status?: string;
}

interface ProgressData {
  series: Array<{ date: string; followers: number }>;
  targets: Array<{
    goalId: string;
    targetValue: number;
    startValue: number;
    startDate: string;
    endDate: string;
  }>;
}

interface GoalsState {
  goals: GoalWithProgress[];
  snapshots: FollowerSnapshot[];
  progressData: ProgressData | null;
  loading: boolean;
  loadingProgress: boolean;
  selectedAccountId: string;
  filterPlatform: string;

  fetchGoals: (params?: { platform?: string; accountId?: string; status?: string }) => Promise<void>;
  createGoal: (data: CreateGoalData) => Promise<boolean>;
  updateGoal: (id: string, data: UpdateGoalData) => Promise<boolean>;
  deleteGoal: (id: string) => Promise<boolean>;
  fetchProgress: (accountId: string, days?: number) => Promise<void>;
  setSelectedAccountId: (id: string) => void;
  setFilterPlatform: (platform: string) => void;
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  snapshots: [],
  progressData: null,
  loading: false,
  loadingProgress: false,
  selectedAccountId: '',
  filterPlatform: '',

  fetchGoals: async (params) => {
    set({ loading: true });
    try {
      const query = new URLSearchParams();
      const { filterPlatform } = get();

      const platform = params?.platform || filterPlatform;
      if (platform) query.set('platform', platform);
      if (params?.accountId) query.set('accountId', params.accountId);
      if (params?.status) query.set('status', params.status);

      const res = await fetch(`/api/goals?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch goals');

      const data = (await res.json()) as GoalWithProgress[];
      set({ goals: data, loading: false });
    } catch (error) {
      console.error('Failed to fetch goals:', error instanceof Error ? error.message : 'Unknown');
      set({ loading: false });
    }
  },

  createGoal: async (data) => {
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create goal');

      // Refresh goals list
      await get().fetchGoals();
      return true;
    } catch (error) {
      console.error('Failed to create goal:', error instanceof Error ? error.message : 'Unknown');
      return false;
    }
  },

  updateGoal: async (id, data) => {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update goal');

      await get().fetchGoals();
      return true;
    } catch (error) {
      console.error('Failed to update goal:', error instanceof Error ? error.message : 'Unknown');
      return false;
    }
  },

  deleteGoal: async (id) => {
    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete goal');

      await get().fetchGoals();
      return true;
    } catch (error) {
      console.error('Failed to delete goal:', error instanceof Error ? error.message : 'Unknown');
      return false;
    }
  },

  fetchProgress: async (accountId, days = 90) => {
    set({ loadingProgress: true });
    try {
      const query = new URLSearchParams({
        accountId,
        days: String(days),
      });

      const res = await fetch(`/api/goals/progress?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch progress');

      const data = (await res.json()) as ProgressData;
      set({ progressData: data, loadingProgress: false });
    } catch (error) {
      console.error('Failed to fetch progress:', error instanceof Error ? error.message : 'Unknown');
      set({ loadingProgress: false });
    }
  },

  setSelectedAccountId: (id) => set({ selectedAccountId: id }),
  setFilterPlatform: (platform) => set({ filterPlatform: platform }),
}));
