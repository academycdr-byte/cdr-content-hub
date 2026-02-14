'use client';

import { Eye, Heart, MessageCircle, Share2 } from 'lucide-react';
import type { AggregatedMetrics } from '@/types';

interface MetricsOverviewProps {
  data: AggregatedMetrics | null;
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

const STAT_CARDS = [
  {
    key: 'views' as const,
    label: 'Total Views',
    icon: Eye,
    color: 'var(--info)',
    bgColor: 'var(--info-surface)',
  },
  {
    key: 'likes' as const,
    label: 'Total Likes',
    icon: Heart,
    color: 'var(--error)',
    bgColor: 'var(--error-surface)',
  },
  {
    key: 'comments' as const,
    label: 'Total Comentarios',
    icon: MessageCircle,
    color: 'var(--success)',
    bgColor: 'var(--success-surface)',
  },
  {
    key: 'shares' as const,
    label: 'Total Shares',
    icon: Share2,
    color: 'var(--warning)',
    bgColor: 'var(--warning-surface)',
  },
];

export default function MetricsOverview({ data, loading }: MetricsOverviewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-[120px]" />
        ))}
      </div>
    );
  }

  const totals = data?.totals || { views: 0, likes: 0, comments: 0, shares: 0, posts: 0 };
  const byPlatform = data?.byPlatform || [];

  // Calculate platform percentages
  const totalViews = totals.views || 1;
  const igData = byPlatform.find((p) => p.platform === 'instagram');
  const tkData = byPlatform.find((p) => p.platform === 'tiktok');
  const igPercent = Math.round(((igData?.views || 0) / totalViews) * 100);
  const tkPercent = Math.round(((tkData?.views || 0) / totalViews) * 100);

  return (
    <div className="space-y-4">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          const value = totals[card.key];
          return (
            <div key={card.key} className="card p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: card.bgColor }}
                >
                  <Icon size={20} style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {formatNumber(value)}
              </p>
              <p className="text-xs text-text-secondary mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Platform Breakdown */}
      {totals.posts > 0 && (
        <div className="card p-5">
          <p className="text-xs font-medium text-text-secondary mb-3">
            Distribuicao por plataforma ({totals.posts} posts)
          </p>
          <div className="flex items-center gap-3 h-3 rounded-full overflow-hidden bg-bg-hover">
            {igPercent > 0 && (
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${igPercent}%`,
                  background: 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)',
                }}
              />
            )}
            {tkPercent > 0 && (
              <div
                className="h-full rounded-full transition-all duration-500 bg-text-primary"
                style={{ width: `${tkPercent}%` }}
              />
            )}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-text-secondary">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: 'linear-gradient(135deg, #833AB4, #E1306C)' }}
              />
              Instagram {igPercent}%
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-text-primary" />
              TikTok {tkPercent}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
