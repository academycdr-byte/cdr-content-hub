'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { BarChart3, Share2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useMetricsStore } from '@/stores/metrics-store';
import MetricsOverview from '@/components/metrics/metrics-overview';
import MetricsChart from '@/components/metrics/metrics-chart';
import TopPostsTable from '@/components/metrics/top-posts-table';
import { cn } from '@/lib/utils';
import type { SocialAccount } from '@/types';

const DATE_PRESETS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1 ano', days: 365 },
] as const;

function getDateFrom(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
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

  const hasSyncedRef = useRef(false);
  const [syncing, setSyncing] = useState(false);

  // Auto-sync social accounts on first mount
  useEffect(() => {
    if (hasSyncedRef.current) return;
    hasSyncedRef.current = true;

    const autoSync = async () => {
      try {
        const accountsRes = await fetch('/api/social/accounts');
        if (!accountsRes.ok) return;

        const accounts = (await accountsRes.json()) as SocialAccount[];
        const syncable = accounts.filter(
          (a) => a.platform === 'instagram' || a.platform === 'tiktok'
        );

        if (syncable.length === 0) return;

        setSyncing(true);

        const syncPromises = syncable.map((account) => {
          const endpoint =
            account.platform === 'instagram'
              ? '/api/social/instagram/sync'
              : '/api/social/tiktok/sync';

          return fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountId: account.id }),
          }).catch((err) => {
            console.error(`Failed to sync ${account.platform} account ${account.username}:`, err instanceof Error ? err.message : 'Unknown');
          });
        });

        await Promise.allSettled(syncPromises);
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

  // Determine active preset
  const activeDays = (() => {
    const diffMs =
      new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return DATE_PRESETS.find((p) => p.days === diffDays)?.days || 0;
  })();

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
      </div>

      {/* Date Range Filter */}
      <div className="card p-4 mb-6">
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
            posts={aggregated?.topPosts || []}
            loading={loadingAggregated}
          />
        </div>
      )}
    </div>
  );
}
