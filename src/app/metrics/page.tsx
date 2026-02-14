'use client';

import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { BarChart3, Share2, RefreshCw, Download } from 'lucide-react';
import Link from 'next/link';
import { useMetricsStore } from '@/stores/metrics-store';
import { useTokenRefresh } from '@/hooks/use-token-refresh';
import MetricsOverview from '@/components/metrics/metrics-overview';
import MetricsChart from '@/components/metrics/metrics-chart';
import TopPostsTable from '@/components/metrics/top-posts-table';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/stores/toast-store';
import type { SocialAccount } from '@/types';

const DATE_PRESETS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1 ano', days: 365 },
] as const;

/** Format date as YYYY-MM-DD in user's local timezone */
function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateFrom(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  return toLocalDateString(d);
}

function getToday(): string {
  return toLocalDateString(new Date());
}

export default function MetricsPage() {
  const {
    metrics,
    aggregated,
    loading,
    loadingAggregated,
    dateRange,
    fetchMetrics,
    fetchAggregated,
    setDateRange,
  } = useMetricsStore();

  // Auto-refresh expiring Instagram tokens silently
  useTokenRefresh();

  const hasSyncedRef = useRef(false);
  const [syncing, setSyncing] = useState(false);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const { addToast } = useToastStore();

  // Auto-sync social accounts on first mount
  useEffect(() => {
    if (hasSyncedRef.current) return;
    hasSyncedRef.current = true;

    const autoSync = async () => {
      try {
        const accountsRes = await fetch('/api/social/accounts');
        if (!accountsRes.ok) return;

        const fetchedAccounts = (await accountsRes.json()) as SocialAccount[];
        setAccounts(fetchedAccounts);
        const syncable = fetchedAccounts.filter(
          (a) => a.platform === 'instagram' || a.platform === 'tiktok'
        );

        if (syncable.length === 0) return;

        setSyncing(true);

        const syncResults = await Promise.allSettled(
          syncable.map(async (account) => {
            const endpoint =
              account.platform === 'instagram'
                ? '/api/social/instagram/sync'
                : '/api/social/tiktok/sync';

            // Timeout after 25s to avoid hanging spinner (Vercel hobby: 10s limit)
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 25000);

            try {
              const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId: account.id }),
                signal: controller.signal,
              });

              if (!res.ok) {
                const data = await res.json().catch(() => ({})) as { error?: string };
                throw new Error(data.error || `Erro ${res.status}`);
              }
              return res.json() as Promise<{ synced: number }>;
            } finally {
              clearTimeout(timeout);
            }
          })
        );

        // Show feedback for sync results
        const failed = syncResults.filter((r) => r.status === 'rejected');
        const succeeded = syncResults.filter((r) => r.status === 'fulfilled');

        if (succeeded.length > 0) {
          const totalSynced = succeeded.reduce((sum, r) => {
            if (r.status === 'fulfilled') {
              const val = r.value as { synced: number };
              return sum + (val.synced || 0);
            }
            return sum;
          }, 0);
          if (totalSynced > 0) {
            addToast(`${totalSynced} posts sincronizados`, 'success');
          }
        }
        if (failed.length > 0) {
          const errMsg = failed[0].status === 'rejected' ? (failed[0].reason as Error).message : '';
          addToast(`Erro ao sincronizar: ${errMsg}`, 'error');
        }
      } catch (error) {
        console.error('Auto-sync failed:', error instanceof Error ? error.message : 'Unknown');
      } finally {
        setSyncing(false);
        // Refresh metrics after sync completes
        fetchMetrics();
        fetchAggregated();
      }
    };

    autoSync();
  }, [fetchMetrics, fetchAggregated]);

  const loadData = useCallback(() => {
    fetchMetrics();
    fetchAggregated();
  }, [fetchMetrics, fetchAggregated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePreset = useCallback(
    (days: number) => {
      const from = getDateFrom(days);
      const to = getToday();
      setDateRange(from, to);
      // Fetch with new date range after state update
      setTimeout(() => {
        fetchMetrics();
        fetchAggregated();
      }, 0);
    },
    [setDateRange, fetchMetrics, fetchAggregated]
  );

  const handleCustomFrom = useCallback(
    (value: string) => {
      setDateRange(value, dateRange.to);
      setTimeout(() => {
        fetchMetrics();
        fetchAggregated();
      }, 0);
    },
    [setDateRange, dateRange.to, fetchMetrics, fetchAggregated]
  );

  const handleCustomTo = useCallback(
    (value: string) => {
      setDateRange(dateRange.from, value);
      setTimeout(() => {
        fetchMetrics();
        fetchAggregated();
      }, 0);
    },
    [setDateRange, dateRange.from, fetchMetrics, fetchAggregated]
  );

  // Determine active preset (diffDays is gap between dates, +1 for inclusive count)
  const activeDays = (() => {
    const diffMs =
      new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return DATE_PRESETS.find((p) => p.days === diffDays + 1)?.days || 0;
  })();

  const handleExportCSV = useCallback(() => {
    const query = new URLSearchParams();
    query.set('from', dateRange.from);
    query.set('to', dateRange.to);

    const url = `/api/metrics/export?${query.toString()}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `metricas-${dateRange.from}-${dateRange.to}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [dateRange]);

  // Filter top posts by platform and account
  const filteredTopPosts = useMemo(() => {
    if (!aggregated?.topPosts) return [];
    return aggregated.topPosts.filter((post) => {
      if (filterPlatform && post.platform !== filterPlatform) return false;
      if (filterAccount && post.socialAccountId !== filterAccount) return false;
      return true;
    });
  }, [aggregated?.topPosts, filterPlatform, filterAccount]);

  const hasData = aggregated && aggregated.totals.posts > 0;
  const isLoading = loading || loadingAggregated;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={24} className="text-accent" />
            <h1 className="text-heading-1 text-text-primary">Metricas</h1>
            {syncing && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-surface text-accent text-xs font-medium">
                <RefreshCw size={12} className="animate-spin" />
                Sincronizando...
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary">
            Acompanhe o desempenho dos seus posts no Instagram e TikTok.
          </p>
        </div>
        {hasData && (
          <button
            onClick={handleExportCSV}
            className="btn-ghost inline-flex items-center gap-2 text-sm"
          >
            <Download size={16} />
            Exportar CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <p className="text-xs font-medium text-text-secondary">Periodo:</p>
          <div className="flex items-center gap-2">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePreset(preset.days)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  activeDays === preset.days
                    ? 'bg-accent text-text-inverted'
                    : 'bg-bg-hover text-text-secondary hover:text-text-primary'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-0 sm:ml-auto">
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => handleCustomFrom(e.target.value)}
              className="input !py-1.5 !px-2 !text-xs w-[130px]"
            />
            <span className="text-xs text-text-tertiary">ate</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => handleCustomTo(e.target.value)}
              className="input !py-1.5 !px-2 !text-xs w-[130px]"
            />
          </div>
        </div>
        {accounts.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs font-medium text-text-secondary">Filtrar:</p>
            <select
              value={filterPlatform}
              onChange={(e) => { setFilterPlatform(e.target.value); setFilterAccount(''); }}
              className={cn(
                'input py-1.5 px-3 text-xs w-auto min-w-[140px]',
                filterPlatform && 'border-accent'
              )}
            >
              <option value="">Todas as plataformas</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
            </select>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className={cn(
                'input py-1.5 px-3 text-xs w-auto min-w-[160px]',
                filterAccount && 'border-accent'
              )}
            >
              <option value="">Todos os perfis</option>
              {accounts
                .filter((a) => !filterPlatform || a.platform === filterPlatform)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    @{a.username} ({a.platform})
                  </option>
                ))}
            </select>
            {(filterPlatform || filterAccount) && (
              <button
                onClick={() => { setFilterPlatform(''); setFilterAccount(''); }}
                className="text-xs text-accent hover:text-accent-hover font-medium transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {!isLoading && !hasData ? (
        // Empty State
        <div className="card p-16 flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-surface mb-4">
            <BarChart3 size={28} className="text-accent" />
          </div>
          <h2 className="text-heading-2 text-text-primary mb-2">
            Nenhuma metrica encontrada
          </h2>
          <p className="text-sm text-text-secondary max-w-md mb-6">
            Conecte suas contas sociais e sincronize para comecar a acompanhar
            o desempenho dos seus posts.
          </p>
          <Link
            href="/social"
            className="btn-accent inline-flex items-center gap-2"
          >
            <Share2 size={16} />
            Ir para Contas Sociais
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <MetricsOverview data={aggregated} loading={loadingAggregated} />
          <MetricsChart metrics={metrics} loading={loading} />
          <TopPostsTable
            posts={filteredTopPosts}
            loading={loadingAggregated}
          />
        </div>
      )}
    </div>
  );
}
