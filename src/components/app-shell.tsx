'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/ui/sidebar';
import MobileBottomNav from '@/components/ui/mobile-bottom-nav';
import SearchCommand from '@/components/ui/search-command';
import CreatePostModal, { type CreatePostData } from '@/components/posts/create-post-modal';
import { useToastStore } from '@/stores/toast-store';
import { useSearchStore } from '@/stores/search-store';
import type { ContentPillar } from '@/types';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { addToast } = useToastStore();
  const { open: openSearch } = useSearchStore();

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);

  const isLoginPage = pathname === '/login';
  const isAuthenticated = status === 'authenticated';

  // Fetch pillars for the create post modal
  const fetchPillars = useCallback(async () => {
    try {
      const res = await fetch('/api/pillars');
      if (!res.ok) return;
      const data = await res.json() as ContentPillar[];
      setPillars(data);
    } catch {
      // Silently fail - pillars will be fetched when modal opens
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPillars();
    }
  }, [isAuthenticated, fetchPillars]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isAuthenticated || isLoginPage) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+K / Cmd+K: Search command palette (works even in inputs)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearch();
        return;
      }

      // Don't trigger other shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          if (pillars.length === 0) {
            fetchPillars();
          }
          setShowCreatePost(true);
          break;
        case 'c':
          e.preventDefault();
          router.push('/calendar');
          break;
        case 'p':
          e.preventDefault();
          router.push('/pipeline');
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated, isLoginPage, router, pillars.length, fetchPillars, openSearch]);

  const handleCreatePost = useCallback(async (data: CreatePostData) => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to create post');
    addToast('Post criado com sucesso!', 'success');
  }, [addToast]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center font-bold"
            style={{ backgroundColor: '#B8FF00', color: '#1D1D1F' }}
          >
            CH
          </div>
          <div className="h-1 w-24 overflow-hidden rounded-full bg-bg-hover">
            <div className="h-full w-1/2 rounded-full animate-[shimmer_1s_ease-in-out_infinite]" style={{ backgroundColor: '#B8FF00' }} />
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' && !isLoginPage) {
    redirect('/login');
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-bg-primary">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-[240px] p-4 md:p-8 pb-20 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Nav - visible only on mobile */}
      <div className="block md:hidden">
        <MobileBottomNav />
      </div>

      {/* Global Search Command Palette (Ctrl+K) */}
      <SearchCommand />

      {/* Global Create Post Modal (triggered by keyboard shortcut) */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSubmit={handleCreatePost}
        pillars={pillars}
      />
    </div>
  );
}
