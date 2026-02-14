'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, FileText } from 'lucide-react';
import { useSearchStore } from '@/stores/search-store';
import { cn } from '@/lib/utils';
import type { Post } from '@/types';
import { FORMAT_LABELS, STATUS_LABELS } from '@/types';

interface SearchResult extends Post {
  pillar?: {
    id: string;
    name: string;
    color: string;
    slug: string;
    targetPercentage: number;
    description: string;
    isActive: boolean;
    order: number;
  };
}

export default function SearchCommand() {
  const { isOpen, close } = useSearchStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      // Small delay to ensure the DOM is ready
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Debounced search
  const searchPosts = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/posts?search=${encodeURIComponent(searchQuery.trim())}`);
      if (!res.ok) throw new Error('Search failed');
      const data = (await res.json()) as SearchResult[];
      setResults(data);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error instanceof Error ? error.message : 'Unknown');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        searchPosts(value);
      }, 300);
    },
    [searchPosts]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Navigate to post
  const navigateToPost = useCallback(
    (postId: string) => {
      close();
      router.push(`/posts/${postId}`);
    },
    [close, router]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          close();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            navigateToPost(results[selectedIndex].id);
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close, results, selectedIndex, navigateToPost]);

  // Click outside to close
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        close();
      }
    },
    [close]
  );

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] animate-backdrop"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="w-full max-w-[560px] mx-4 overflow-hidden animate-scale-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 border-b border-border-default">
          <Search size={18} className="text-text-tertiary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Buscar posts por titulo..."
            className="flex-1 bg-transparent py-4 text-[15px] text-text-primary placeholder:text-text-tertiary outline-none"
          />
          <div className="flex items-center gap-2">
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-md hover:bg-bg-hover transition-colors"
              >
                <X size={14} className="text-text-tertiary" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary bg-bg-hover rounded border border-border-default">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div
                className="h-5 w-5 rounded-full border-2 border-t-transparent"
                style={{
                  borderColor: 'var(--text-tertiary)',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.6s linear infinite',
                }}
              />
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
              <Search size={32} className="mb-3 opacity-40" />
              <p className="text-sm font-medium">Nenhum post encontrado</p>
              <p className="text-xs mt-1">Tente outro termo de busca</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="py-2 px-2">
              <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
              </p>
              {results.map((post, index) => (
                <button
                  key={post.id}
                  onClick={() => navigateToPost(post.id)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors',
                    index === selectedIndex
                      ? 'bg-accent-surface'
                      : 'hover:bg-bg-hover'
                  )}
                >
                  <FileText size={16} className="text-text-tertiary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-text-primary truncate">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {/* Format badge */}
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: 'var(--accent-surface)',
                          color: 'var(--accent)',
                        }}
                      >
                        {FORMAT_LABELS[post.format as keyof typeof FORMAT_LABELS] || post.format}
                      </span>
                      {/* Pillar */}
                      {post.pillar && (
                        <span className="text-[11px] text-text-secondary">
                          {post.pillar.name}
                        </span>
                      )}
                      {/* Status */}
                      <span className="text-[11px] text-text-tertiary">
                        {STATUS_LABELS[post.status as keyof typeof STATUS_LABELS] || post.status}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && !query && (
            <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
              <Search size={32} className="mb-3 opacity-40" />
              <p className="text-sm font-medium">Busca rapida</p>
              <p className="text-xs mt-1">Digite para buscar posts por titulo</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border-default text-[11px] text-text-tertiary">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-bg-hover border border-border-default font-mono text-[10px]">
                &uarr;&darr;
              </kbd>
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-bg-hover border border-border-default font-mono text-[10px]">
                &crarr;
              </kbd>
              abrir
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-bg-hover border border-border-default font-mono text-[10px]">
              ESC
            </kbd>
            fechar
          </span>
        </div>
      </div>
    </div>
  );
}
