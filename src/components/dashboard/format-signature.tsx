'use client';

import { useEffect, useState, useCallback } from 'react';
import { BarChart3, TrendingUp, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SocialAccount } from '@/types';

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

function SignatureList({ signatures }: { signatures: FormatSignatureItem[] }) {
  const maxViews = Math.max(...signatures.map((s) => s.avgViews), 1);

  return (
    <div className="space-y-2">
      {signatures.map((item, index) => {
        const isBest = index === 0 && signatures.length > 1;
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
  );
}

export default function FormatSignature() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [dataMap, setDataMap] = useState<Record<string, FormatSignatureData>>({});
  const [loading, setLoading] = useState(true);

  // Fetch accounts
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await fetch('/api/social/accounts');
        if (!res.ok) return;
        const data = (await res.json()) as SocialAccount[];
        setAccounts(data);
      } catch {
        // silent
      }
    };
    loadAccounts();
  }, []);

  // Fetch data for all accounts + global
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch global (all accounts)
      const globalRes = await fetch('/api/analytics/format-signature');
      if (globalRes.ok) {
        const globalData = await globalRes.json() as FormatSignatureData;
        setDataMap((prev) => ({ ...prev, '': globalData }));
      }

      // Fetch per-account
      for (const acc of accounts) {
        const res = await fetch(`/api/analytics/format-signature?accountId=${acc.id}`);
        if (res.ok) {
          const accData = await res.json() as FormatSignatureData;
          setDataMap((prev) => ({ ...prev, [acc.id]: accData }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch format signatures:', error instanceof Error ? error.message : 'Unknown');
    } finally {
      setLoading(false);
    }
  }, [accounts]);

  useEffect(() => {
    if (accounts.length > 0) {
      fetchAll();
    } else {
      // Still fetch global even without accounts loaded
      const fetchGlobal = async () => {
        try {
          const res = await fetch('/api/analytics/format-signature');
          if (res.ok) {
            const data = await res.json() as FormatSignatureData;
            setDataMap({ '': data });
          }
        } catch {
          // silent
        } finally {
          setLoading(false);
        }
      };
      fetchGlobal();
    }
  }, [accounts, fetchAll]);

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

  const currentData = dataMap[selectedAccountId];

  if (!currentData || currentData.signatures.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-accent" />
          <p className="text-label text-text-tertiary">Assinatura de Formato</p>
        </div>
        {accounts.length > 1 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setSelectedAccountId('')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                !selectedAccountId ? 'bg-accent text-text-inverted' : 'bg-bg-hover text-text-secondary hover:text-text-primary'
              )}
            >
              Todos
            </button>
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => setSelectedAccountId(acc.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  selectedAccountId === acc.id ? 'bg-accent text-text-inverted' : 'bg-bg-hover text-text-secondary hover:text-text-primary'
                )}
              >
                @{acc.username}
              </button>
            ))}
          </div>
        )}
        <p className="text-sm text-text-tertiary text-center py-4">
          Sincronize métricas para ver a performance por formato
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-accent" />
          <p className="text-label text-text-tertiary">Assinatura de Formato</p>
        </div>
      </div>

      {/* Profile selector */}
      {accounts.length > 1 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setSelectedAccountId('')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              !selectedAccountId ? 'bg-accent text-text-inverted' : 'bg-bg-hover text-text-secondary hover:text-text-primary'
            )}
          >
            Todos
          </button>
          {accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                selectedAccountId === acc.id ? 'bg-accent text-text-inverted' : 'bg-bg-hover text-text-secondary hover:text-text-primary'
              )}
            >
              @{acc.username}
            </button>
          ))}
        </div>
      )}

      {/* Insight */}
      {currentData.insight && (
        <div className="flex items-center gap-2 rounded-lg bg-accent-surface px-3 py-2 mb-4">
          <TrendingUp size={14} className="text-accent shrink-0" />
          <p className="text-xs font-medium text-accent">{currentData.insight}</p>
        </div>
      )}

      <SignatureList signatures={currentData.signatures} />
    </div>
  );
}
