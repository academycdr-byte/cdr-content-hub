import { create } from 'zustand';
import type { BatchSession, Post } from '@/types';

interface BatchSessionWithPosts extends BatchSession {
  posts: {
    id: string;
    sessionId: string;
    postId: string;
    order: number;
    recordingNotes: string | null;
    post: Post;
  }[];
}

interface BatchState {
  sessions: BatchSessionWithPosts[];
  loading: boolean;
  selectedSession: BatchSessionWithPosts | null;

  fetchSessions: () => Promise<void>;
  createSession: (data: CreateSessionInput) => Promise<BatchSessionWithPosts | null>;
  updateSessionStatus: (id: string, status: string, advancePostsStatus?: string) => Promise<boolean>;
  addPostToSession: (sessionId: string, postId: string) => Promise<boolean>;
  removePostFromSession: (sessionId: string, postId: string) => Promise<boolean>;
  selectSession: (session: BatchSessionWithPosts | null) => void;
  fetchSession: (id: string) => Promise<BatchSessionWithPosts | null>;
}

interface CreateSessionInput {
  title: string;
  scheduledDate: string;
  notes?: string;
}

export const useBatchStore = create<BatchState>((set, _get) => ({
  sessions: [],
  loading: false,
  selectedSession: null,

  fetchSessions: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/batch-sessions');
      if (!res.ok) throw new Error('Failed to fetch sessions');

      const sessions = await res.json() as BatchSessionWithPosts[];
      set({ sessions, loading: false });
    } catch (error) {
      console.error('Failed to fetch batch sessions:', error instanceof Error ? error.message : 'Unknown');
      set({ loading: false });
    }
  },

  createSession: async (data) => {
    try {
      const res = await fetch('/api/batch-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to create session');

      const session = await res.json() as BatchSessionWithPosts;
      set((state) => ({ sessions: [session, ...state.sessions] }));
      return session;
    } catch (error) {
      console.error('Failed to create session:', error instanceof Error ? error.message : 'Unknown');
      return null;
    }
  },

  updateSessionStatus: async (id, status, advancePostsStatus) => {
    try {
      const body: Record<string, string> = { status };
      if (advancePostsStatus) {
        body.advancePostsStatus = advancePostsStatus;
      }

      const res = await fetch(`/api/batch-sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to update session');

      const updated = await res.json() as BatchSessionWithPosts;
      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === id ? updated : s)),
        selectedSession: state.selectedSession?.id === id ? updated : state.selectedSession,
      }));
      return true;
    } catch (error) {
      console.error('Failed to update session:', error instanceof Error ? error.message : 'Unknown');
      return false;
    }
  },

  addPostToSession: async (sessionId, postId) => {
    try {
      const res = await fetch(`/api/batch-sessions/${sessionId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      if (!res.ok) {
        if (res.status === 409) {
          return false; // Already exists
        }
        throw new Error('Failed to add post');
      }

      // Re-fetch the session to get updated data
      const sessionRes = await fetch(`/api/batch-sessions/${sessionId}`);
      if (sessionRes.ok) {
        const updated = await sessionRes.json() as BatchSessionWithPosts;
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === sessionId ? updated : s)),
          selectedSession: state.selectedSession?.id === sessionId ? updated : state.selectedSession,
        }));
      }

      return true;
    } catch (error) {
      console.error('Failed to add post to session:', error instanceof Error ? error.message : 'Unknown');
      return false;
    }
  },

  removePostFromSession: async (sessionId, postId) => {
    try {
      const res = await fetch(`/api/batch-sessions/${sessionId}/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove post');

      // Re-fetch the session
      const sessionRes = await fetch(`/api/batch-sessions/${sessionId}`);
      if (sessionRes.ok) {
        const updated = await sessionRes.json() as BatchSessionWithPosts;
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === sessionId ? updated : s)),
          selectedSession: state.selectedSession?.id === sessionId ? updated : state.selectedSession,
        }));
      }

      return true;
    } catch (error) {
      console.error('Failed to remove post from session:', error instanceof Error ? error.message : 'Unknown');
      return false;
    }
  },

  selectSession: (session) => set({ selectedSession: session }),

  fetchSession: async (id) => {
    try {
      const res = await fetch(`/api/batch-sessions/${id}`);
      if (!res.ok) throw new Error('Failed to fetch session');

      const session = await res.json() as BatchSessionWithPosts;
      set({ selectedSession: session });
      return session;
    } catch (error) {
      console.error('Failed to fetch session:', error instanceof Error ? error.message : 'Unknown');
      return null;
    }
  },
}));
