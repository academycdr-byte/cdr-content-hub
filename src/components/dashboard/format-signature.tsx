'use client';

import { useEffect, useState, useCallback } from 'react';
import { BarChart3, TrendingUp, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormatSignatureItem {
  format: string;
  totalPosts: number;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
}

interface FormatSignatureData {
  signatures: FormatSignatureItem[];
  bestFormat: FormatSignatureItem | null;
  insight: string;
}

const FORMAT_DISPLAY: Record<string, string> = {
  REEL: 'Reel',
  CAROUSEL: 'Carrossel',
  STATIC: 'Post',
  STORY: 'Story',
  VIDEO: 'Video',
};

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export default function FormatSignature() {
  const [data, setData] = useState<FormatSignatureData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/format-signature');
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json() as FormatSignatureData;
      setData(result);
    } catch (error) {
      console.error('Failed to fetch format signatures:', error instanceof Error ? error.message : 'Unknown');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="card p-6">
        <div className="skeleton h-5 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.signatures.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-accent" />
          <p className="text-label text-text-tertiary">Assinatura de Formato</p>
        </div>
        <p className="text-sm text-text-tertiary text-center py-4">
          Sincronize metricas para ver a performance por formato
        </p>
      </div>
    );
  }

  const maxViews = Math.max(...data.signatures.map((s) => s.avgViews), 1);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-accent" />
          <p className="text-label text-text-tertiary">Assinatura de Formato</p>
        </div>
      </div>

      {/* Insight */}
      {data.insight && (
        <div className="flex items-center gap-2 rounded-lg bg-accent-surface px-3 py-2 mb-4">
          <TrendingUp size={14} className="text-accent shrink-0" />
          <p className="text-xs font-medium text-accent">{data.insight}</p>
        </div>
      )}

      {/* Table */}
      <div className="space-y-2">
        {data.signatures.map((item, index) => {
          const isBest = index === 0 && data.signatures.length > 1;
          const barWidth = Math.max((item.avgViews / maxViews) * 100, 8);

          return (
            <div
              key={item.format}
              className={cn(
                'rounded-xl border p-3 transition-colors',
                isBest
                  ? 'border-accent bg-accent-surface'
                  : 'border-border-default bg-bg-secondary'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isBest && (
                    <span className="text-[10px] font-bold text-accent bg-accent-surface px-1.5 py-0.5 rounded">
                      MELHOR
                    </span>
                  )}
                  <span className="text-sm font-semibold text-text-primary">
                    {FORMAT_DISPLAY[item.format] || item.format}
                  </span>
                  <span className="text-[11px] text-text-tertiary">
                    {item.totalPosts} post{item.totalPosts !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div className="h-4 bg-bg-hover rounded overflow-hidden mb-2">
                <div
                  className="h-full rounded flex items-center justify-end pr-2 transition-all duration-300"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: isBest ? 'var(--accent)' : 'var(--text-tertiary)',
                  }}
                >
                  <span className="text-[9px] font-bold text-text-inverted">
                    {formatNumber(item.avgViews)} views
                  </span>
                </div>
              </div>

              {/* Metrics row */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Eye size={10} className="text-text-tertiary" />
                  <span className="text-[11px] text-text-secondary">{formatNumber(item.avgViews)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart size={10} className="text-text-tertiary" />
                  <span className="text-[11px] text-text-secondary">{formatNumber(item.avgLikes)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle size={10} className="text-text-tertiary" />
                  <span className="text-[11px] text-text-secondary">{formatNumber(item.avgComments)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Share2 size={10} className="text-text-tertiary" />
                  <span className="text-[11px] text-text-secondary">{formatNumber(item.avgShares)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
