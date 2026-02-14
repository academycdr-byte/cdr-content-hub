'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  CalendarDays,
  ArrowRight,
  TrendingUp,
  Clock,
  Flame,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  DollarSign,
  Award,
  ExternalLink,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { STATUS_LABELS } from '@/types';
import ContentMixChart from '@/components/dashboard/content-mix-chart';
import ConsistencyHeatmap from '@/components/dashboard/consistency-heatmap';
import DateRangeFilter, {
  computeDateRange,
  getDateRangeLabel,
} from '@/components/dashboard/date-range-filter';
import type { DateRange } from '@/components/dashboard/date-range-filter';

// ===== Interfaces =====

interface PipelineStatusItem {
  status: string;
  count: number;
  color: string;
}

interface PillarMixItem {
  id: string;
  name: string;
  slug: string;
  color: string;
  targetPercentage: number;
  count: number;
  percentage: number;
}

interface UpcomingPostItem {
  id: string;
  title: string;
  scheduledDate: string;
  pillarName: string;
  pillarColor: string;
  format: string;
}

interface MetricsSummary {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  posts: number;
}

interface DateRangeInfo {
  startDate: string;
  endDate: string;
  label: string;
}

interface PlatformBreakdown {
  platform: string;
  label: string;
  postsCount: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  cpmValue: number;
}

interface ProfileBreakdown {
  accountId: string;
  displayName: string;
  username: string;
  platform: string;
  postsCount: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  cpmValue: number;
}

interface TopPostItem {
  id: string;
  caption: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
  platform: string;
  thumbnailUrl: string;
  postUrl: string;
  publishedAt: string;
  mediaType: string;
  accountName: string;
}

interface DashboardStats {
  postsThisMonth: number;
  monthlyGoal: number;
  consistencyScore: number;
  pipeline: PipelineStatusItem[];
  contentMix: PillarMixItem[];
  upcomingPosts: UpcomingPostItem[];
  resultsWithoutPost: number;
  metricsSummary: MetricsSummary | null;
  dateRange: DateRangeInfo;
  totalCpmValue: number;
  platformBreakdown: PlatformBreakdown[];
  profileBreakdown: ProfileBreakdown[];
  topPosts: TopPostItem[];
}

// ===== Helpers =====

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E4405F',
  tiktok: '#000000',
  youtube: '#FF0000',
  facebook: '#1877F2',
  twitter: '#1DA1F2',
};

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
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="skeleton h-4 w-72 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-[120px]" />
          ))}
        </div>
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
          <p className="text-sm text-text-secondary mb-4">Nao foi possivel carregar os dados.</p>
          <button onClick={() => fetchStats(dateRange)} className="btn-accent">Tentar novamente</button>
        </div>
      </div>
    );
  }

  const progressPercentage = stats && stats.monthlyGoal > 0
    ? Math.min(Math.round((stats.postsThisMonth / stats.monthlyGoal) * 100), 100)
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
      <div className="mb-6">
        <h1 className="text-display text-text-primary">Dashboard</h1>
        <p className="mt-2 text-text-secondary">
          Visao geral da sua producao de conteudo.
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6">
        <DateRangeFilter value={dateRange} onChange={handleDateRangeChange} />
      </div>

      {/* Loading overlay for refetch */}
      <div className={loading ? 'opacity-50 pointer-events-none transition-opacity duration-200' : 'transition-opacity duration-200'}>
        {stats && (
          <>
            {/* ===== HERO KPIs ===== */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* Posts Publicados */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-label text-text-tertiary">Posts Publicados</p>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-surface">
                    <CalendarDays size={14} className="text-accent" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-3xl font-bold text-text-primary">{stats.postsThisMonth}</p>
                  <p className="text-sm text-text-secondary">/ {stats.monthlyGoal}</p>
                </div>
                <div className="h-1.5 w-full rounded-full bg-bg-hover overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%`, backgroundColor: '#B8FF00' }}
                  />
                </div>
                <p className="text-[11px] text-text-tertiary mt-1.5">{progressPercentage}% da meta</p>
              </div>

              {/* Total Views */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-label text-text-tertiary">Views</p>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-surface">
                    <Eye size={14} className="text-accent" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-text-primary">
                  {stats.metricsSummary ? formatMetricNumber(stats.metricsSummary.views) : '--'}
                </p>
                <p className="text-[11px] text-text-tertiary mt-1.5">{periodLabel}</p>
              </div>

              {/* Engajamento Total */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-label text-text-tertiary">Engajamento</p>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-surface">
                    <Heart size={14} className="text-accent" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-text-primary">
                  {totalEngagement > 0 ? formatMetricNumber(totalEngagement) : '--'}
                </p>
                {stats.metricsSummary && stats.metricsSummary.posts > 0 && (
                  <p className="text-[11px] text-text-tertiary mt-1.5">
                    {formatMetricNumber(stats.metricsSummary.likes)} likes + {formatMetricNumber(stats.metricsSummary.comments)} coment. + {formatMetricNumber(stats.metricsSummary.shares)} shares
                  </p>
                )}
                {(!stats.metricsSummary || stats.metricsSummary.posts === 0) && (
                  <p className="text-[11px] text-text-tertiary mt-1.5">{periodLabel}</p>
                )}
              </div>

              {/* Valor Estimado (CPM) */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-label text-text-tertiary">Valor Estimado</p>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-surface">
                    <DollarSign size={14} className="text-accent" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-text-primary">
                  {stats.totalCpmValue > 0 ? formatCurrency(stats.totalCpmValue) : '--'}
                </p>
                <p className="text-[11px] text-text-tertiary mt-1.5">baseado em CPM</p>
              </div>
            </div>

            {/* ===== TOP POSTS (Performance Highlights) ===== */}
            {stats.topPosts.length > 0 && (
              <div className="card p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-accent" />
                    <h2 className="text-heading-2 text-text-primary">Destaques de Performance</h2>
                  </div>
                  <span className="text-[11px] text-text-tertiary">{periodLabel}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stats.topPosts.slice(0, 3).map((post, index) => (
                    <div
                      key={post.id}
                      className="rounded-xl border border-border-default p-4 hover:border-accent transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        {/* Rank badge */}
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-sm"
                          style={{
                            backgroundColor: index === 0 ? '#B8FF0020' : index === 1 ? '#E5E5EA20' : '#CD7F3220',
                            color: index === 0 ? '#B8FF00' : index === 1 ? '#C0C0C0' : '#CD7F32',
                          }}
                        >
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {post.caption || 'Sem legenda'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
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
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border-default">
                        <div className="flex items-center gap-1">
                          <Eye size={12} className="text-text-tertiary" />
                          <span className="text-xs font-semibold text-text-primary">{formatMetricNumber(post.views)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart size={12} className="text-text-tertiary" />
                          <span className="text-xs font-semibold text-text-primary">{formatMetricNumber(post.likes)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle size={12} className="text-text-tertiary" />
                          <span className="text-xs font-semibold text-text-primary">{formatMetricNumber(post.comments)}</span>
                        </div>
                        <div className="flex items-center gap-1">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                                  backgroundColor: PLATFORM_COLORS[p.platform] || '#6E6E73',
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
                                  backgroundColor: PLATFORM_COLORS[p.platform] || '#6E6E73',
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

            {/* ===== SOCIAL METRICS DETAIL ===== */}
            {stats.metricsSummary && stats.metricsSummary.posts > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye size={14} className="text-text-tertiary" />
                    <p className="text-[11px] text-text-tertiary">Views</p>
                  </div>
                  <p className="text-xl font-bold text-text-primary">
                    {formatMetricNumber(stats.metricsSummary.views)}
                  </p>
                </div>
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart size={14} className="text-text-tertiary" />
                    <p className="text-[11px] text-text-tertiary">Likes</p>
                  </div>
                  <p className="text-xl font-bold text-text-primary">
                    {formatMetricNumber(stats.metricsSummary.likes)}
                  </p>
                </div>
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle size={14} className="text-text-tertiary" />
                    <p className="text-[11px] text-text-tertiary">Comentarios</p>
                  </div>
                  <p className="text-xl font-bold text-text-primary">
                    {formatMetricNumber(stats.metricsSummary.comments)}
                  </p>
                </div>
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Share2 size={14} className="text-text-tertiary" />
                    <p className="text-[11px] text-text-tertiary">Shares</p>
                  </div>
                  <p className="text-xl font-bold text-text-primary">
                    {formatMetricNumber(stats.metricsSummary.shares)}
                  </p>
                </div>
              </div>
            )}

            {/* ===== PRODUCTION: Content Mix + Pipeline + Proximos ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* Content Mix */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-label text-text-tertiary">
                    Mix de Conteudo {periodLabel}
                  </p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-surface">
                    <BarChart3 size={16} className="text-accent" />
                  </div>
                </div>
                {stats.contentMix.length > 0 && stats.contentMix.some((p) => p.count > 0) ? (
                  <ContentMixChart data={stats.contentMix} compact />
                ) : (
                  <div className="flex flex-col items-center justify-center py-6">
                    <p className="text-sm text-text-tertiary">Crie posts para ver a distribuicao</p>
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
                              style={{ width: `${barWidth}%`, backgroundColor: s.color }}
                            >
                              <span className="text-[10px] font-bold text-white">{s.count}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  {totalInPipeline === 0 && (
                    <p className="text-xs text-text-tertiary">Nenhum post em producao</p>
                  )}
                </div>
              </div>

              {/* Proximos Posts */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-label text-text-tertiary">Proximos Posts</p>
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

            {/* ===== CONSISTENCY & RESULTS ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Consistency card */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-label text-text-tertiary">Consistencia</p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-surface">
                    <Flame size={16} className="text-accent" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-3xl font-bold text-text-primary">
                    {stats.consistencyScore > 0 ? `${stats.consistencyScore}%` : '--'}
                  </p>
                </div>
                <p className="text-sm text-text-secondary">
                  {stats.consistencyScore === 0
                    ? 'Comece a publicar para ver seu score'
                    : stats.consistencyScore >= 80
                      ? 'Excelente consistencia!'
                      : stats.consistencyScore >= 50
                        ? 'Boa frequencia, continue assim!'
                        : 'Tente publicar mais vezes por semana'}
                </p>
              </div>

              {/* Results */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-label text-text-tertiary">Resultados</p>
                  <Link
                    href="/results"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-surface hover:bg-accent-surface-hover transition-colors"
                  >
                    <ArrowRight size={16} className="text-accent" />
                  </Link>
                </div>
                <p className="text-3xl font-bold text-text-primary mb-1">{stats.resultsWithoutPost}</p>
                <p className="text-sm text-text-secondary">
                  resultado{stats.resultsWithoutPost !== 1 ? 's' : ''} cadastrado{stats.resultsWithoutPost !== 1 ? 's' : ''}
                </p>
                {stats.resultsWithoutPost > 0 && (
                  <Link
                    href="/results"
                    className="text-xs text-accent hover:text-accent-hover font-medium flex items-center gap-1 mt-2"
                  >
                    <TrendingUp size={12} />
                    Transformar em case study
                  </Link>
                )}
              </div>

              {/* Metrics Posts count */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-label text-text-tertiary">Posts Sincronizados</p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-surface">
                    <TrendingUp size={16} className="text-accent" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-text-primary mb-1">
                  {stats.metricsSummary?.posts || 0}
                </p>
                <p className="text-sm text-text-secondary">
                  posts com metricas {periodLabel}
                </p>
              </div>
            </div>

            {/* Consistency Heatmap */}
            <div className="mb-4">
              <ConsistencyHeatmap />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
