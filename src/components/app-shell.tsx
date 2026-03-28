'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { redirect } from 'next/navigation';
import { Search } from 'lucide-react';
import Sidebar from '@/components/ui/sidebar';
import MobileBottomNav from '@/components/ui/mobile-bottom-nav';
import SearchCommand from '@/components/ui/search-command';
import NotificationBell from '@/components/ui/notification-bell';
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

  const fetchPillars = useCallback(async () => {
    try {
      const res = await fetch('/api/pillars');
      if (!res.ok) return;
      const data = await res.json() as ContentPillar[];
      setPillars(data);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPillars();
    }
  }, [isAuthenticated, fetchPillars]);

  useEffect(() => {
    if (!isAuthenticated || isLoginPage) return;

    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearch();
        return;
      }

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
          if (pillars.length === 0) fetchPillars();
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
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: 'var(--bg-outer)' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center font-bold"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverted)' }}
          >
            CH
          </div>
          <div className="h-1 w-24 overflow-hidden rounded-full bg-bg-hover">
            <div className="h-full w-1/2 rounded-full animate-[shimmer_1s_ease-in-out_infinite]" style={{ backgroundColor: 'var(--accent)' }} />
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
    <div className="min-h-screen md:p-3" style={{ backgroundColor: 'var(--bg-outer)' }}>
      {/* Single container — like the Dribbble reference: ONE white card with rounded corners */}
      <div
        className="hidden md:flex md:flex-col md:min-h-[calc(100vh-24px)]"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '20px',
          overflow: 'hidden',
        }}
      >
        {/* Top Header — spans full width (sidebar + content) */}
        <header
          className="flex items-center justify-between shrink-0"
          style={{
            height: '72px',
            padding: '0 32px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center text-xs font-bold"
              style={{ backgroundColor: 'var(--accent)', color: '#fff', borderRadius: '12px' }}
            >
              CH
            </div>
            <span className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>
              Content Hub
            </span>
          </div>

          {/* Center: Search */}
          <button
            onClick={openSearch}
            className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm transition-colors"
            style={{
              width: '400px',
              border: '1px solid var(--border)',
              color: 'var(--text-tertiary)',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <Search size={16} />
            <span className="flex-1 text-left">Search</span>
            <kbd
              className="text-[11px] font-medium px-1.5 py-0.5 rounded-md"
              style={{
                backgroundColor: 'var(--bg-hover)',
                border: '1px solid var(--border)',
                color: 'var(--text-tertiary)',
              }}
            >
              Ctrl+K
            </kbd>
          </button>

          {/* Right: Icons + Avatar */}
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div
              className="flex items-center gap-3 pl-4"
              style={{ borderLeft: '1px solid var(--border)' }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
              >
                IF
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Ivan</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Body: Sidebar + Content side by side */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar — no border, no bg, just part of the same container */}
          <Sidebar />

          {/* Content area — slightly different bg for contrast */}
          <main
            className="flex-1 p-8 overflow-y-auto"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            {children}
          </main>
        </div>
      </div>

      {/* Mobile layout — simple, no floating container */}
      <div className="md:hidden min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <main className="p-4 pb-20">
          {children}
        </main>
        <MobileBottomNav />
      </div>

      <SearchCommand />

      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSubmit={handleCreatePost}
        pillars={pillars}
      />
    </div>
  );
}
