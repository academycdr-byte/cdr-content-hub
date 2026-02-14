'use client';

import { useState, useMemo } from 'react';
import { ExternalLink, Instagram, Music2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PostMetrics } from '@/types';

type SortColumn = 'views' | 'likes' | 'comments' | 'shares';

interface TopPostsTableProps {
  posts: PostMetrics[];
  loading: boolean;
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: 1,
    }).format(value / 1_000_000) + 'M';
  }
  if (value >= 1_000) {
    return new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: 1,
    }).format(value / 1_000) + 'K';
  }
  return new Intl.NumberFormat('pt-BR').format(value);
}

function getEngagementRate(post: PostMetrics): string {
  if (!post.views || post.views === 0) return '0%';
  const rate = ((post.likes + post.comments) / post.views) * 100;
  return rate.toFixed(1) + '%';
}

function PlatformBadge({ platform }: { platform: string }) {
  if (platform === 'instagram') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[rgba(225,48,108,0.1)] text-[#E1306C]">
        <Instagram size={12} />
        Instagram
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-bg-hover text-text-primary">
      <Music2 size={12} />
      TikTok
    </span>
  );
}

const SORT_COLUMNS: { key: SortColumn; label: string }[] = [
  { key: 'views', label: 'Views' },
  { key: 'likes', label: 'Likes' },
  { key: 'comments', label: 'Comentarios' },
  { key: 'shares', label: 'Shares' },
] as const;

export default function TopPostsTable({ posts, loading }: TopPostsTableProps) {
  const [sortBy, setSortBy] = useState<SortColumn>('views');

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [posts, sortBy]);

  if (loading) {
    return (
      <div className="card p-5">
        <div className="skeleton h-4 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="card p-8 flex flex-col items-center justify-center text-center">
        <p className="text-sm text-text-secondary">
          Nenhum post encontrado para o periodo selecionado.
        </p>
      </div>
    );
  }

  const sortLabel = SORT_COLUMNS.find((c) => c.key === sortBy)?.label || 'Views';

  return (
    <div className="card overflow-hidden">
      <div className="p-5 border-b border-border-default">
        <p className="text-sm font-medium text-text-primary">
          Top Posts por {sortLabel}
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-default">
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-text-tertiary px-5 py-3 w-8">
                #
              </th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-text-tertiary px-3 py-3">
                Post
              </th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-text-tertiary px-3 py-3 w-24">
                Plataforma
              </th>
              {SORT_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => setSortBy(col.key)}
                  className={cn(
                    'text-right text-[11px] font-semibold uppercase tracking-wider px-3 py-3 w-24 cursor-pointer select-none transition-colors',
                    sortBy === col.key
                      ? 'text-accent'
                      : 'text-text-tertiary hover:text-text-secondary'
                  )}
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    {col.label}
                    {sortBy === col.key && <ChevronDown size={10} />}
                  </span>
                </th>
              ))}
              <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-text-tertiary px-3 py-3 w-24">
                Engajamento
              </th>
              <th className="text-center text-[11px] font-semibold uppercase tracking-wider text-text-tertiary px-3 py-3 w-12">
                Link
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPosts.map((post, index) => (
              <tr
                key={post.id}
                className="border-b border-border-default last:border-0 hover:bg-bg-hover transition-colors"
              >
                <td className="px-5 py-3">
                  <span className="text-xs font-bold text-text-tertiary">
                    {index + 1}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    {post.thumbnailUrl ? (
                      <img
                        src={post.thumbnailUrl}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-bg-hover flex-shrink-0" />
                    )}
                    <p className="text-sm text-text-primary truncate max-w-[300px]">
                      {post.caption || 'Sem legenda'}
                    </p>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <PlatformBadge platform={post.platform} />
                </td>
                {SORT_COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-3 py-3 text-right',
                      sortBy === col.key && 'bg-accent-surface/50'
                    )}
                  >
                    <span
                      className={cn(
                        'text-sm',
                        sortBy === col.key
                          ? 'font-semibold text-accent'
                          : 'text-text-secondary'
                      )}
                    >
                      {formatNumber(post[col.key])}
                    </span>
                  </td>
                ))}
                <td className="px-3 py-3 text-right">
                  <span className="text-sm font-medium text-accent">
                    {getEngagementRate(post)}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  {post.postUrl && (
                    <a
                      href={post.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-bg-hover transition-colors text-text-tertiary hover:text-text-primary"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="md:hidden">
        {/* Mobile sort selector */}
        <div className="px-4 py-2 border-b border-border-default flex items-center gap-2">
          <span className="text-[11px] text-text-tertiary">Ordenar por:</span>
          <div className="flex items-center gap-1">
            {SORT_COLUMNS.map((col) => (
              <button
                key={col.key}
                onClick={() => setSortBy(col.key)}
                className={cn(
                  'px-2 py-1 rounded-md text-[11px] font-medium transition-colors',
                  sortBy === col.key
                    ? 'bg-accent text-text-inverted'
                    : 'text-text-tertiary hover:text-text-secondary'
                )}
              >
                {col.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border-default">
          {sortedPosts.map((post, index) => (
            <div key={post.id} className="p-4 flex items-start gap-3">
              <span className="text-xs font-bold text-text-tertiary mt-1 w-5 flex-shrink-0">
                {index + 1}
              </span>
              {post.thumbnailUrl ? (
                <img
                  src={post.thumbnailUrl}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-bg-hover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">
                  {post.caption || 'Sem legenda'}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <PlatformBadge platform={post.platform} />
                  <span className={cn(
                    'text-xs font-medium',
                    sortBy === 'views' ? 'text-accent' : 'text-text-secondary'
                  )}>
                    {formatNumber(post.views)} views
                  </span>
                  <span className="text-xs font-medium text-accent">
                    {getEngagementRate(post)}
                  </span>
                </div>
                {sortBy !== 'views' && (
                  <div className="mt-1">
                    <span className="text-xs font-medium text-accent">
                      {formatNumber(post[sortBy])} {SORT_COLUMNS.find(c => c.key === sortBy)?.label.toLowerCase()}
                    </span>
                  </div>
                )}
              </div>
              {post.postUrl && (
                <a
                  href={post.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-tertiary hover:text-text-primary flex-shrink-0 mt-1"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
