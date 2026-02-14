import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

interface PillarMixItem {
  id: string;
  name: string;
  slug: string;
  color: string;
  targetPercentage: number;
  count: number;
  percentage: number;
}

interface PipelineStatusItem {
  status: string;
  count: number;
  color: string;
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

const STATUS_COLORS: Record<string, string> = {
  IDEA: '#6E6E73',
  SCRIPT: '#2563EB',
  PRODUCTION: '#7C3AED',
  REVIEW: '#D97706',
  SCHEDULED: '#16A34A',
  PUBLISHED: '#4A7A00',
};

function parseDateRange(request: NextRequest): { start: Date; end: Date; label: string } {
  const url = new URL(request.url);
  const startParam = url.searchParams.get('startDate');
  const endParam = url.searchParams.get('endDate');

  const now = new Date();

  if (startParam && endParam) {
    const start = new Date(startParam);
    const end = new Date(endParam);

    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      // Ensure start is beginning of day, end is end of day
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return {
        start,
        end,
        label: 'custom',
      };
    }
  }

  // Default: current month
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end, label: 'this_month' };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { start: rangeStart, end: rangeEnd, label: rangeLabel } = parseDateRange(request);
    const now = new Date();

    const [
      publishedInRange,
      postsInRange,
      allPosts,
      pillars,
      upcomingPosts,
      totalResults,
      metricsAggregate,
    ] = await Promise.all([
      // Posts published in the selected range
      prisma.post.count({
        where: {
          status: 'PUBLISHED',
          updatedAt: { gte: rangeStart, lte: rangeEnd },
        },
      }),
      // Posts created in range (for content mix)
      prisma.post.findMany({
        where: {
          createdAt: { gte: rangeStart, lte: rangeEnd },
        },
        select: { id: true, status: true, pillarId: true, scheduledDate: true, updatedAt: true },
      }),
      // All posts for pipeline count (pipeline is always global)
      prisma.post.findMany({
        select: { id: true, status: true, pillarId: true, scheduledDate: true, updatedAt: true },
      }),
      // All active pillars
      prisma.contentPillar.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
      // Next 3 scheduled posts (always future, not affected by filter)
      prisma.post.findMany({
        where: {
          scheduledDate: { gte: now },
          status: { in: ['SCHEDULED', 'REVIEW', 'PRODUCTION', 'SCRIPT', 'IDEA'] },
        },
        include: { contentPillar: true },
        orderBy: { scheduledDate: 'asc' },
        take: 3,
      }),
      // Total results count
      prisma.clientResult.count(),
      // Social metrics aggregate for the selected range
      prisma.postMetrics.aggregate({
        where: {
          publishedAt: { gte: rangeStart, lte: rangeEnd },
        },
        _sum: {
          views: true,
          likes: true,
          comments: true,
          shares: true,
        },
        _count: true,
      }),
    ]);

    // Calculate consistency score for the selected period
    const consistencyScore = calculateConsistencyScore(allPosts, rangeStart, rangeEnd);

    // Pipeline counts by status (global, not filtered)
    const statusCounts: Record<string, number> = {};
    for (const post of allPosts) {
      statusCounts[post.status] = (statusCounts[post.status] || 0) + 1;
    }

    const pipeline: PipelineStatusItem[] = [
      'IDEA', 'SCRIPT', 'PRODUCTION', 'REVIEW', 'SCHEDULED', 'PUBLISHED',
    ].map((status) => ({
      status,
      count: statusCounts[status] || 0,
      color: STATUS_COLORS[status] || '#6E6E73',
    }));

    // Content mix by pillar (filtered by range)
    const totalPostsInRange = postsInRange.length;
    const pillarCounts: Record<string, number> = {};
    for (const post of postsInRange) {
      pillarCounts[post.pillarId] = (pillarCounts[post.pillarId] || 0) + 1;
    }

    const contentMix: PillarMixItem[] = pillars.map((pillar) => ({
      id: pillar.id,
      name: pillar.name,
      slug: pillar.slug,
      color: pillar.color,
      targetPercentage: pillar.targetPercentage,
      count: pillarCounts[pillar.id] || 0,
      percentage: totalPostsInRange > 0
        ? Math.round(((pillarCounts[pillar.id] || 0) / totalPostsInRange) * 100)
        : 0,
    }));

    // Upcoming posts formatting
    const upcoming: UpcomingPostItem[] = upcomingPosts.map((post) => ({
      id: post.id,
      title: post.title,
      scheduledDate: post.scheduledDate?.toISOString() || '',
      pillarName: post.contentPillar.name,
      pillarColor: post.contentPillar.color,
      format: post.format,
    }));

    // Results without post
    const resultsWithoutPost = totalResults;

    // Build metrics summary
    const metricsSummary: MetricsSummary | null =
      metricsAggregate._count > 0
        ? {
            views: metricsAggregate._sum.views || 0,
            likes: metricsAggregate._sum.likes || 0,
            comments: metricsAggregate._sum.comments || 0,
            shares: metricsAggregate._sum.shares || 0,
            posts: metricsAggregate._count,
          }
        : null;

    const stats: DashboardStats = {
      postsThisMonth: publishedInRange,
      monthlyGoal: 16,
      consistencyScore,
      pipeline,
      contentMix,
      upcomingPosts: upcoming,
      resultsWithoutPost,
      metricsSummary,
      dateRange: {
        startDate: rangeStart.toISOString(),
        endDate: rangeEnd.toISOString(),
        label: rangeLabel,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}

function calculateConsistencyScore(
  posts: Array<{ status: string; scheduledDate: Date | null; updatedAt: Date }>,
  rangeStart: Date,
  rangeEnd: Date
): number {
  const publishedPosts = posts.filter((p) => p.status === 'PUBLISHED');
  if (publishedPosts.length === 0) return 0;

  // Calculate number of weeks in the range
  const rangeMs = rangeEnd.getTime() - rangeStart.getTime();
  const rangeDays = Math.ceil(rangeMs / (1000 * 60 * 60 * 24));
  const numWeeks = Math.max(Math.ceil(rangeDays / 7), 1);
  // Cap at 12 weeks for reasonable computation
  const weeksToCalculate = Math.min(numWeeks, 12);

  const weekScores: number[] = [];

  for (let weekOffset = 0; weekOffset < weeksToCalculate; weekOffset++) {
    const weekStart = new Date(rangeStart);
    weekStart.setDate(rangeStart.getDate() + weekOffset * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Don't exceed rangeEnd
    if (weekStart > rangeEnd) break;
    if (weekEnd > rangeEnd) {
      weekEnd.setTime(rangeEnd.getTime());
    }

    // Count unique days with published posts in this week
    const daysWithPosts = new Set<string>();
    for (const post of publishedPosts) {
      const postDate = post.scheduledDate || post.updatedAt;
      if (postDate >= weekStart && postDate <= weekEnd) {
        const dayKey = `${postDate.getFullYear()}-${postDate.getMonth()}-${postDate.getDate()}`;
        daysWithPosts.add(dayKey);
      }
    }

    // Score = (days with post / 4) * 100, capped at 100
    const weekScore = Math.min((daysWithPosts.size / 4) * 100, 100);
    weekScores.push(weekScore);
  }

  if (weekScores.length === 0) return 0;

  // Average of week scores
  const totalScore = weekScores.reduce((sum, s) => sum + s, 0);
  return Math.round(totalScore / weekScores.length);
}
