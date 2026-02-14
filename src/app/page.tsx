'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  CalendarDays,
  Trophy,
  ArrowRight,
  TrendingUp,
  Clock,
  Flame,
  Eye,
  Heart,
  MessageCircle,
  Share2,
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
}

function formatMetricNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return String(value);
}

function formatInputDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(() => computeDateRange('30d'));
  const isFirstLoad = useRef(true);

  const fetchStats = useCallback(async (range: DateRange) => {
    try {
      if (!isFirstLoad.current) {
        setLoading(true);
      }

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

  if (loading && isFirstLoad.current) {
    return (
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="skeleton h-4 w-72 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-[180px]" />
          ))}
        </div>
      </div>
    );
  }

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
            {/* Top Row: 3 cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Posts no Periodo */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-label text-text-tertiary">
                    Posts {periodLabel}
                  </p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-surface">
                    <CalendarDays size={16} className="text-accent" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-display text-text-primary">{stats.postsThisMonth}</p>
                  <p className="text-sm text-text-secondary">/ {stats.monthlyGoal}</p>
                </div>
                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-bg-hover overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progressPercentage}%`,
                      backgroundColor: '#B8FF00',
                    }}
                  />
                </div>
                <p className="text-xs text-text-tertiary mt-2">{progressPercentage}% da meta</p>
              </div>

              {/* Consistencia */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-label text-text-tertiary">
                    Consistencia {periodLabel}
                  </p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-surface">
                    <Flame size={16} className="text-accent" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-display text-text-primary">
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
                <p className="text-display text-text-primary mb-3">{totalInPipeline}</p>
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
                              style={{
                                width: `${barWidth}%`,
                                backgroundColor: s.color,
                              }}
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
            </div>

            {/* Social Metrics Row */}
            {stats.metricsSummary && stats.metricsSummary.posts > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-label text-text-tertiary">Views</p>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-surface">
                      <Eye size={14} className="text-accent" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">
                    {formatMetricNumber(stats.metricsSummary.views)}
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-1">{periodLabel}</p>
                </div>
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-label text-text-tertiary">Likes</p>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-surface">
                      <Heart size={14} className="text-accent" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">
                    {formatMetricNumber(stats.metricsSummary.likes)}
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-1">{periodLabel}</p>
                </div>
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-label text-text-tertiary">Comentarios</p>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-surface">
                      <MessageCircle size={14} className="text-accent" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">
                    {formatMetricNumber(stats.metricsSummary.comments)}
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-1">{periodLabel}</p>
                </div>
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-label text-text-tertiary">Shares</p>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-surface">
                      <Share2 size={14} className="text-accent" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">
                    {formatMetricNumber(stats.metricsSummary.shares)}
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-1">{periodLabel}</p>
                </div>
              </div>
            )}

            {/* Bottom Row: 3 cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

              {/* Resultados sem Post */}
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
                {stats.resultsWithoutPost > 0 ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-surface mb-3">
                      <Trophy size={22} className="text-warning" />
                    </div>
                    <p className="text-2xl font-bold text-text-primary mb-1">
                      {stats.resultsWithoutPost}
                    </p>
                    <p className="text-sm text-text-secondary text-center mb-3">
                      resultado{stats.resultsWithoutPost !== 1 ? 's' : ''} cadastrado{stats.resultsWithoutPost !== 1 ? 's' : ''}
                    </p>
                    <Link
                      href="/results"
                      className="text-xs text-accent hover:text-accent-hover font-medium flex items-center gap-1"
                    >
                      <TrendingUp size={12} />
                      Transformar em case study
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6">
                    <Trophy size={24} className="text-text-tertiary mb-2" />
                    <p className="text-sm text-text-tertiary">Nenhum resultado cadastrado</p>
                    <Link
                      href="/results"
                      className="text-xs text-accent hover:text-accent-hover mt-2 font-medium"
                    >
                      Cadastrar resultado
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Consistency Heatmap & Badges */}
            <div className="mt-4">
              <ConsistencyHeatmap />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
