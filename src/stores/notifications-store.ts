import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'warning' | 'info' | 'error';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface NotificationsState {
  notifications: Notification[];
  loading: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  fetchNotifications: () => Promise<void>;
  unreadCount: () => number;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  loading: false,

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = (await res.json()) as Notification[];
      set({ notifications: data, loading: false });
    } catch (error) {
      console.error(
        'Failed to fetch notifications:',
        error instanceof Error ? error.message : 'Unknown'
      );
      set({ loading: false });
    }
  },

  unreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },
}));
