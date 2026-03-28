'use client';

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { MONTH_NAMES } from '@/lib/utils';
import type { ContentPillar, Post, SocialAccount } from '@/types';

interface CalendarHeaderProps {
  year: number;
  month: number;
  posts: Post[];
  pillars: ContentPillar[];
  socialAccounts?: SocialAccount[];
  selectedAccountId?: string | null;
  onAccountFilter?: (accountId: string | null) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onNewPost: () => void;
}

export default function CalendarHeader({
  year,
  month,
  posts,
  pillars,
  socialAccounts = [],
  selectedAccountId,
  onAccountFilter,
  onPrevMonth,
  onNextMonth,
  onToday,
  onNewPost,
}: CalendarHeaderProps) {
  const totalPosts = posts.length;

  // Calculate pillar distribution
  const pillarCounts = pillars.map((pillar) => {
    const count = posts.filter((p) => p.pillarId === pillar.id).length;
    return { ...pillar, count };
  });

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Left: Month Navigation */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevMonth}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-bg-hover transition-colors"
            title="Mês anterior"
          >
            <ChevronLeft size={20} className="text-text-secondary" />
          </button>
          <button
            onClick={onNextMonth}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-bg-hover transition-colors"
            title="Próximo mês"
          >
            <ChevronRight size={20} className="text-text-secondary" />
          </button>
        </div>

        <h1 className="text-[30px] font-bold leading-tight text-text-primary">
          {MONTH_NAMES[month]} {year}
        </h1>

        <button
          onClick={onToday}
          className="btn-ghost text-xs py-1.5 px-3"
        >
          Hoje
        </button>
      </div>

      {/* Right: Summary + Actions */}
      <div className="flex items-center gap-4">
        {/* Pillar Summary */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm text-text-secondary font-medium">{totalPosts} posts</span>
          <span className="text-text-tertiary">|</span>
          {pillarCounts.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1.5"
              title={`${p.name}: ${p.count} posts`}
            >
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-xs text-text-secondary">{p.count}</span>
            </div>
          ))}
        </div>

        {/* Account Filter */}
        {socialAccounts.length > 0 && onAccountFilter && (
          <select
            value={selectedAccountId || ''}
            onChange={(e) => onAccountFilter(e.target.value || null)}
            className="input text-sm py-1.5 px-3 max-w-[180px]"
          >
            <option value="">Todos os perfis</option>
            {socialAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.platform === 'instagram' ? 'IG' : 'TT'} @{acc.username}
              </option>
            ))}
          </select>
        )}

        {/* New Post Button */}
        <button
          onClick={onNewPost}
          className="btn-accent flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          Novo Post
        </button>
      </div>
    </div>
  );
}
