import { create } from 'zustand';
import type { Post, ContentPillar } from '@/types';

interface PostsState {
  posts: Post[];
  pillars: ContentPillar[];
  loading: boolean;
  currentMonth: number;
  currentYear: number;

  setPosts: (posts: Post[]) => void;
  setPillars: (pillars: ContentPillar[]) => void;
  setLoading: (loading: boolean) => void;
  setMonth: (year: number, month: number) => void;
  addPost: (post: Post) => void;
  updatePost: (id: string, data: Partial<Post>) => void;
  removePost: (id: string) => void;

  fetchPosts: (year: number, month: number) => Promise<void>;
  fetchAllPosts: () => Promise<Post[]>;
  fetchPillars: () => Promise<void>;
  updatePostStatus: (id: string, status: string) => Promise<boolean>;
}

const now = new Date();

export const usePostsStore = create<PostsState>((set, get) => ({
  posts: [],
  pillars: [],
  loading: false,
  currentMonth: now.getMonth(),
  currentYear: now.getFullYear(),

  setPosts: (posts) => set({ posts }),
  setPillars: (pillars) => set({ pillars }),
  setLoading: (loading) => set({ loading }),

  setMonth: (year, month) => {
    set({ currentYear: year, currentMonth: month });
    get().fetchPosts(year, month);
  },

  addPost: (post) => set((state) => ({ posts: [...state.posts, post] })),

  updatePost: (id, data) =>
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),

  removePost: (id) =>
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== id),
    })),

  fetchPosts: async (year, month) => {
    set({ loading: true });
    try {
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      const res = await fetch(`/api/posts?month=${monthStr}`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      const posts = await res.json() as Post[];
      set({ posts, loading: false });
    } catch (error) {
      console.error('Failed to fetch posts:', error instanceof Error ? error.message : 'Unknown');
      set({ loading: false });
    }
  },

  fetchAllPosts: async () => {
    try {
      const res = await fetch('/api/posts');
      if (!res.ok) throw new Error('Failed to fetch posts');
      const posts = await res.json() as Post[];
      return posts;
    } catch (error) {
      console.error('Failed to fetch all posts:', error instanceof Error ? error.message : 'Unknown');
      return [];
    }
  },

  fetchPillars: async () => {
    try {
      const res = await fetch('/api/pillars');
      if (!res.ok) throw new Error('Failed to fetch pillars');
      const pillars = await res.json() as ContentPillar[];
      set({ pillars });
    } catch (error) {
      console.error('Failed to fetch pillars:', error instanceof Error ? error.message : 'Unknown');
    }
  },

  updatePostStatus: async (id, status) => {
    try {
      const res = await fetch(`/api/posts/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) return false;

      const updatedPost = await res.json() as Post;
      set((state) => ({
        posts: state.posts.map((p) => (p.id === id ? updatedPost : p)),
      }));
      return true;
    } catch (error) {
      console.error('Failed to update post status:', error instanceof Error ? error.message : 'Unknown');
      return false;
    }
  },
}));
