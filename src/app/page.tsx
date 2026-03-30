'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  CalendarDays,
  ArrowRight,
  TrendingUp,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  DollarSign,
  Award,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { PLATFORM_COLORS } from '@/lib/constants';
import { STATUS_LABELS, type DashboardStats } from '@/types';
import ContentMixChart from '@/components/dashboard/content-mix-chart';
import DateRangeFilter, {
  computeDateRange,
  getDateRangeLabel,
} from '@/components/dashboard/date-range-filter';
import type { DateRange } from '@/components/dashboard/date-range-filter';
import SignalsPanel from '@/components/dashboard/signals-panel';
import FormatSignature from '@/components/dashboard/format-signature';
import FollowerEvolutionChart from '@/components/dashboard/follower-evolution-chart';

// ===== Helpers =====

function formatMetricNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

function formatInputDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ===== Component =====

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(() => computeDateRange('30d'));
  const [signalsOpen, setSignalsOpen] = useState(false);
  const isFirstLoad = useRef(true);

  const fetchStats = useCallback(async (range: DateRange) => {
    try {
      if (!isFirstLoad.current) setLoading(true);

      const params = new URLSearchParams({
        startDate: formatInputDate(range.start),
        endDate: formatInputDate(range.end),
      });

      const res = await fetch(`/api/dashboard/stats?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json() as DashboardStats;
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error instanceof Error ? error.message : 'Unknown');
    } finally {
      setLoading(false);
      isFirstLoad.current = false;
    }
  }, []);

  useEffect(() => {
    fetchStats(dateRange);
  }, [fetchStats, dateRange]);

  const handleDateRangeChange = useCallback((newRange: DateRange) => {
    setDateRange(newRange);
  }, []);

  const periodLabel = getDateRangeLabel(dateRange);

  // Loading skeleton
  if (loading && isFirstLoad.current) {
    return (
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="skeleton h-7 w-40 mb-2" />
            <div className="skeleton h-4 w-64" />
          </div>
          <div className="skeleton h-9 w-48" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-[180px]" />
          ))}
        </div>
        <div className="skeleton h-14 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-[200px]" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (!stats && !loading) {
    return (
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="card p-16 flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error-surface mb-4">
            <BarChart3 size={28} className="text-error" />
          </div>
          <h2 className="text-heading-2 text-text-primary mb-2">Erro ao carregar dashboard</h2>
          <p className="text-sm text-text-secondary mb-4">Não foi possível carregar os dados.</p>
          <button onClick={() => fetchStats(dateRange)} className="btn-accent">Tentar novamente</button>
        </div>
      </div>
    );
  }

  const syncedPostsCount = stats?.metricsSummary?.posts || 0;
  const progressPercentage = stats && stats.monthlyGoal > 0
    ? Math.min(Math.round((syncedPostsCount / stats.monthlyGoal) * 100), 100)
    : 0;

  const totalInPipeline = stats
    ? stats.pipeline
        .filter((s) => s.status !== 'PUBLISHED')
        .reduce((sum, s) => sum + s.count, 0)
    : 0;

  const totalEngagement = stats?.metricsSummary
    ? stats.metricsSummary.likes + stats.metricsSummary.comments + stats.metricsSummary.shares
    : 0;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-[24px] sm:text-[30px] font-bold leading-tight text-text-primary">Dashboard</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Visão geral da sua produção de conteúdo
          </p>
        </div>
        <DateRangeFilter value={dateRange} onChange={handleDateRangeChange} />
      </div>

      {/* Loading overlay for refetch */}
      <div className={loading ? 'opacity-50 pointer-events-none transition-opacity duration-200' : 'transition-opacity duration-200'}>
        {stats && (
          <>
            {/* ===== HERO KPIs ===== */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {/* Posts Publicados */}
              <div className="card p-4 sm:p-7">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-accent-surface">
                    <CalendarDays size={20} className="text-accent" />
                  </div>
                </div>
                <p className="text-sm font-medium text-text-secondary mb-2">Posts Publicados</p>
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-[28px] sm:text-kpi-value font-bold text-text-primary" style={{ letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{syncedPostsCount}</p>
                  <p className="text-sm text-text-tertiary">/ {stats.monthlyGoal}</p>
                </div>
                <div className="h-1.5 w-full rounded-full bg-bg-hover overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%`, backgroundColor: 'var(--accent)' }}
                  />
                </div>
                <p className="text-[13px] text-text-tertiary">{progressPercentage}% da meta</p>
              </div>

              {/* Total Views */}
              <div className="card p-4 sm:p-7">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-accent-surface">
                    <Eye size={20} className="text-accent" />
                  </div>
                </div>
                <p className="text-sm font-medium text-text-secondary mb-2">Views</p>
                <p className="text-[28px] sm:text-kpi-value font-bold text-text-primary" style={{ letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {stats.metricsSummary ? formatMetricNumber(stats.metricsSummary.views) : '--'}
                </p>
                <p className="text-[13px] text-text-tertiary mt-1">{periodLabel}</p>
              </div>

              {/* Engajamento Total */}
              <div className="card p-4 sm:p-7">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-accent-surface">
                    <Heart size={20} className="text-accent" />
                  </div>
                </div>
                <p className="text-sm font-medium text-text-secondary mb-2">Engajamento</p>
                <p className="text-[28px] sm:text-kpi-value font-bold text-text-primary" style={{ letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {totalEngagement > 0 ? formatMetricNumber(totalEngagement) : '--'}
                </p>
                {stats.metricsSummary && stats.metricsSummary.posts > 0 ? (
                  <p className="text-[13px] text-text-tertiary mt-1">
                    {formatMetricNumber(stats.metricsSummary.likes)} likes + {formatMetricNumber(stats.metricsSummary.comments)} coment. + {formatMetricNumber(stats.metricsSummary.shares)} shares
                  </p>
                ) : (
                  <p className="text-[13px] text-text-tertiary mt-1">{periodLabel}</p>
                )}
              </div>

              {/* Valor Estimado (CPM) */}
              <div className="card p-4 sm:p-7">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-accent-surface">
                    <DollarSign size={20} className="text-accent" />
                  </div>
                </div>
                <p className="text-sm font-medium text-text-secondary mb-2">Valor Estimado</p>
                <p className="text-[28px] sm:text-kpi-value font-bold text-text-primary" style={{ letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {stats.totalCpmValue > 0 ? formatCurrency(stats.totalCpmValue) : '--'}
                </p>
                <p className="text-[13px] text-text-tertiary mt-1">baseado em CPM</p>
              </div>
            </div>

            {/* ===== SIGNALS (collapsible) ===== */}
            <div className="mb-8">
              <button
                onClick={() => setSignalsOpen(!signalsOpen)}
                className="w-full flex items-center justify-between card p-4 mb-0 hover:bg-bg-hover transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-surface">
                    <TrendingUp size={16} className="text-accent" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-text-primary">Sinais de Performance</p>
                    <p className="text-xs text-text-tertiary">Insights e recomendações</p>
                  </div>
                </div>
                <ChevronDown
                  size={18}
                  className={cn(
                    'text-text-tertiary transition-transform duration-200',
                    signalsOpen && 'rotate-180'
                  )}
                />
              </button>
              {signalsOpen && (
                <div className="mt-2">
                  <SignalsPanel />
                </div>
              )}
            </div>

            {/* ===== TOP POSTS (Performance Highlights) ===== */}
            {stats.topPosts.length > 0 && (
              <div className="card p-6 mb-8">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-surface">
                      <Award size={16} className="text-accent" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-text-primary">Destaques de Performance</h2>
                      <span className="text-xs text-text-tertiary">{periodLabel}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.topPosts.slice(0, 3).map((post, index) => (
                    <div
                      key={post.id}
                      className="rounded-xl border border-border-default p-5 hover:border-accent transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        {/* Rank badge */}
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-sm"
                          style={{
                            backgroundColor: 'var(--accent-surface)',
                            color: 'var(--accent)',
                          }}
                        >
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {post.caption || 'Sem legenda'}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: `${PLATFORM_COLORS[post.platform] || '#6E6E73'}15`,
                                color: PLATFORM_COLORS[post.platform] || '#6E6E73',
                              }}
                            >
                              {post.platform === 'instagram' ? 'IG' : post.platform === 'tiktok' ? 'TT' : post.platform}
                            </span>
                            <span className="text-[10px] text-text-tertiary">@{post.accountName}</span>
                          </div>
                        </div>
                        {post.postUrl && (
                          <a
                            href={post.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ExternalLink size={14} className="text-text-tertiary hover:text-accent" />
                          </a>
                        )}
                      </div>
                      {/* Metrics row */}
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border-default">
                        <div className="flex items-center gap-1.5">
                          <Eye size={12} className="text-text-tertiary" />
                          <span className="text-xs font-semibold text-text-primary">{formatMetricNumber(post.views)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Heart size={12} className="text-text-tertiary" />
                          <span className="text-xs font-semibold text-text-primary">{formatMetricNumber(post.likes)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MessageCircle size={12} className="text-text-tertiary" />
                          <span className="text-xs font-semibold text-text-primary">{formatMetricNumber(post.comments)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Share2 size={12} className="text-text-tertiary" />
                          <span className="text-xs font-semibold text-text-primary">{formatMetricNumber(post.shares)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== BREAKDOWNS: Por Rede & Por Perfil ===== */}
            {(stats.platformBreakdown.length > 0 || stats.profileBreakdown.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {/* Posts & Valor por Rede */}
                <div className="card p-6">
                  <p className="text-label text-text-tertiary mb-4">Por Rede {periodLabel}</p>
                  {stats.platformBreakdown.length > 0 ? (
                    <div className="space-y-3">
                      {stats.platformBreakdown.map((p) => {
                        const maxPosts = Math.max(...stats.platformBreakdown.map((x) => x.postsCount), 1);
                        const barWidth = Math.max((p.postsCount / maxPosts) * 100, 12);
                        return (
                          <div key={p.platform}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: PLATFORM_COLORS[p.platform] || '#6E6E73' }}
                                />
                                <span className="text-sm font-medium text-text-primary">{p.label}</span>
                              </div>
                              <span className="text-xs text-text-secondary">{p.postsCount} posts</span>
                            </div>
                            <div className="h-5 bg-bg-hover rounded overflow-hidden mb-1">
                              <div
                                className="h-full rounded flex items-center justify-end pr-2 transition-all duration-300"
                                style={{
                                  width: `${barWidth}%`,
                                  backgroundColor: 'var(--accent)',
                                }}
                              >
                                <span className="text-[10px] font-bold text-white">
                                  {formatMetricNumber(p.views)} views
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-text-tertiary">
                                {formatMetricNumber(p.likes)} likes / {formatMetricNumber(p.comments)} coment.
                              </span>
                              <span className="text-[10px] font-semibold text-accent">
                                {formatCurrency(p.cpmValue)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-text-tertiary text-center py-4">Sem dados de redes sociais</p>
                  )}
                </div>

                {/* Posts & Valor por Perfil */}
                <div className="card p-6">
                  <p className="text-label text-text-tertiary mb-4">Por Perfil {periodLabel}</p>
                  {stats.profileBreakdown.length > 0 ? (
                    <div className="space-y-3">
                      {stats.profileBreakdown.map((p) => {
                        const maxPosts = Math.max(...stats.profileBreakdown.map((x) => x.postsCount), 1);
                        const barWidth = Math.max((p.postsCount / maxPosts) * 100, 12);
                        return (
                          <div key={p.accountId}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: PLATFORM_COLORS[p.platform] || '#6E6E73' }}
                                />
                                <span className="text-sm font-medium text-text-primary">{p.displayName}</span>
                                <span className="text-[10px] text-text-tertiary">@{p.username}</span>
                              </div>
                              <span className="text-xs text-text-secondary">{p.postsCount} posts</span>
                            </div>
                            <div className="h-5 bg-bg-hover rounded overflow-hidden mb-1">
                              <div
                                className="h-full rounded flex items-center justify-end pr-2 transition-all duration-300"
                                style={{
                                  width: `${barWidth}%`,
                                  backgroundColor: 'var(--accent)',
                                }}
                              >
                                <span className="text-[10px] font-bold text-white">
                                  {formatMetricNumber(p.views)} views
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-text-tertiary">
                                {formatMetricNumber(p.likes)} likes / {formatMetricNumber(p.comments)} coment.
                              </span>
                              <span className="text-[10px] font-semibold text-accent">
                                {formatCurrency(p.cpmValue)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-text-tertiary text-center py-4">Conecte perfis para ver dados</p>
                  )}
                </div>
              </div>
            )}

            {/* ===== FOLLOWER EVOLUTION CHART ===== */}
            <div className="mb-6 sm:mb-8">
              <FollowerEvolutionChart />
            </div>

            {/* ===== SOCIAL METRICS DETAIL ===== */}
            {stats.metricsSummary && stats.metricsSummary.posts > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye size={14} className="text-text-tertiary" />
                    <p className="text-xs text-text-tertiary">Views</p>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">
                    {formatMetricNumber(stats.metricsSummary.views)}
                  </p>
                </div>
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart size={14} className="text-text-tertiary" />
                    <p className="text-xs text-text-tertiary">Likes</p>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">
                    {formatMetricNumber(stats.metricsSummary.likes)}
                  </p>
                </div>
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle size={14} className="text-text-tertiary" />
                    <p className="text-xs text-text-tertiary">Comentários</p>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">
                    {formatMetricNumber(stats.metricsSummary.comments)}
                  </p>
                </div>
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Share2 size={14} className="text-text-tertiary" />
                    <p className="text-xs text-text-tertiary">Shares</p>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">
                    {formatMetricNumber(stats.metricsSummary.shares)}
                  </p>
                </div>
              </div>
            )}

            {/* ===== PRODUCTION: Content Mix + Pipeline + Proximos ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {/* Content Mix */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-label text-text-tertiary">
                    Mix de Conteúdo {periodLabel}
                  </p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-surface">
                    <BarChart3 size={16} className="text-accent" />
                  </div>
                </div>
                {stats.contentMix.length > 0 && stats.contentMix.some((p) => p.count > 0) ? (
                  <ContentMixChart data={stats.contentMix} compact />
                ) : (
                  <div className="flex flex-col items-center justify-center py-6">
                    <p className="text-sm text-text-tertiary">Crie posts para ver a distribuição</p>
                  </div>
                )}
              </div>

              {/* Pipeline */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-label text-text-tertiary">Pipeline</p>
                  <Link
                    href="/pipeline"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-surface hover:bg-accent-surface-hover transition-colors"
                  >
                    <ArrowRight size={16} className="text-accent" />
                  </Link>
                </div>
                <p className="text-2xl font-bold text-text-primary mb-3">{totalInPipeline}</p>
                <div className="space-y-2">
                  {stats.pipeline
                    .filter((s) => s.count > 0)
                    .map((s) => {
                      const maxCount = Math.max(...stats.pipeline.map((p) => p.count), 1);
                      const barWidth = Math.max((s.count / maxCount) * 100, 8);
                      return (
                        <div key={s.status} className="flex items-center gap-2">
                          <span className="text-[11px] text-text-secondary w-20 shrink-0">
                            {STATUS_LABELS[s.status as keyof typeof STATUS_LABELS] || s.status}
                          </span>
                          <div className="flex-1 h-4 bg-bg-hover rounded overflow-hidden">
                            <div
                              className="h-full rounded flex items-center justify-end pr-1.5 transition-all duration-300"
                              style={{ width: `${barWidth}%`, backgroundColor: 'var(--accent)' }}
                            >
                              <span className="text-[10px] font-bold text-white">{s.count}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  {totalInPipeline === 0 && (
                    <p className="text-xs text-text-tertiary">Nenhum post em produção</p>
                  )}
                </div>
              </div>

              {/* Próximos Posts */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-label text-text-tertiary">Próximos Posts</p>
                  <Link
                    href="/calendar"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-surface hover:bg-accent-surface-hover transition-colors"
                  >
                    <ArrowRight size={16} className="text-accent" />
                  </Link>
                </div>
                {stats.upcomingPosts.length > 0 ? (
                  <div className="space-y-3">
                    {stats.upcomingPosts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/posts/${post.id}`}
                        className="flex items-start gap-3 group"
                      >
                        <div className="flex flex-col items-center shrink-0 pt-0.5">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: post.pillarColor }}
                          />
                          <div className="w-px h-full bg-border-default mt-1" />
                        </div>
                        <div className="flex-1 min-w-0 pb-2">
                          <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent transition-colors">
                            {post.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-text-tertiary flex items-center gap-1">
                              <Clock size={10} />
                              {formatDate(post.scheduledDate)}
                            </span>
                            <span
                              className="badge text-[10px] py-0 px-1.5"
                              style={{
                                backgroundColor: `${post.pillarColor}15`,
                                color: post.pillarColor,
                              }}
                            >
                              {post.pillarName}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6">
                    <Clock size={24} className="text-text-tertiary mb-2" />
                    <p className="text-sm text-text-tertiary">Nenhum post agendado</p>
                    <Link
                      href="/calendar"
                      className="text-xs text-accent hover:text-accent-hover mt-2 font-medium"
                    >
                      Agendar post
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* ===== GOALS PROGRESS + CONTENT MIX COMPARISON ===== */}
            {(stats.goalsProgress.length > 0 || stats.contentMixComparison.length > 0) && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {/* Goals Progress */}
                {stats.goalsProgress.length > 0 && (
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-label text-text-tertiary">Metas em Andamento</p>
                      <Link
                        href="/goals"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-surface hover:bg-accent-surface-hover transition-colors"
                      >
                        <ArrowRight size={16} className="text-accent" />
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {stats.goalsProgress.map((g) => (
                        <div key={`${g.accountId}-${g.metricType}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-text-primary font-medium">{g.accountName}</span>
                            <span className={cn(
                              'text-xs font-semibold',
                              g.onTrack ? 'text-success' : 'text-warning'
                            )}>
                              {Math.round(g.progress)}%
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-bg-hover overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(g.progress, 100)}%`,
                                backgroundColor: g.onTrack ? 'var(--success)' : 'var(--warning)',
                              }}
                            />
                          </div>
                          <p className="text-[10px] text-text-tertiary mt-0.5">
                            {g.metricType}: {formatMetricNumber(g.current)} / {formatMetricNumber(g.target)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Mix: Meta vs Realizado */}
                {stats.contentMixComparison.length > 0 && (
                  <div className="card p-6">
                    <p className="text-label text-text-tertiary mb-4">Mix de Conteúdo: Meta vs Realizado</p>
                    <div className="space-y-3">
                      {stats.contentMixComparison.map((item) => (
                        <div key={item.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-text-primary font-medium">{item.name}</span>
                            <span className={cn(
                              'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                              item.status === 'ok' && 'bg-success-surface text-success',
                              item.status === 'warning' && 'bg-warning-surface text-warning',
                              item.status === 'critical' && 'bg-error-surface text-error',
                            )}>
                              {item.deviation > 0 ? '+' : ''}{item.deviation}pp
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="h-4 bg-bg-hover rounded overflow-hidden relative">
                                {/* Target line */}
                                <div
                                  className="absolute top-0 bottom-0 w-0.5 bg-text-tertiary z-10"
                                  style={{ left: `${item.targetPct}%` }}
                                />
                                {/* Actual bar */}
                                <div
                                  className="h-full rounded transition-all duration-300"
                                  style={{
                                    width: `${Math.min(item.actualPct, 100)}%`,
                                    backgroundColor: item.status === 'ok' ? 'var(--success)' : item.status === 'warning' ? 'var(--warning)' : 'var(--error)',
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-[10px] text-text-tertiary w-20 text-right shrink-0">
                              {item.actualPct}% / {item.targetPct}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* ===== FORMAT SIGNATURE ===== */}
            <div className="mb-8">
              <FormatSignature />
            </div>

          </>
        )}
      </div>
    </div>
  );
}
