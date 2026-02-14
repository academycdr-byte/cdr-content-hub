import { NextResponse } from 'next/server';
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

interface DashboardStats {
  postsThisMonth: number;
  monthlyGoal: number;
  consistencyScore: number;
  pipeline: PipelineStatusItem[];
  contentMix: PillarMixItem[];
  upcomingPosts: UpcomingPostItem[];
  resultsWithoutPost: number;
  metricsSummary: MetricsSummary | null;
}

const STATUS_COLORS: Record<string, string> = {
  IDEA: '#6E6E73',
  SCRIPT: '#2563EB',
  PRODUCTION: '#7C3AED',
  REVIEW: '#D97706',
  SCHEDULED: '#16A34A',
  PUBLISHED: '#4A7A00',
};

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Run all queries in parallel
    // Last 30 days for metrics summary
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      publishedThisMonth,
      allPosts,
      pillars,
      upcomingPosts,
      totalResults,
      metricsAggregate,
    ] = await Promise.all([
      // Posts published this month
      prisma.post.count({
        where: {
          status: 'PUBLISHED',
          updatedAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      // All posts for pipeline count
      prisma.post.findMany({
        select: { id: true, status: true, pillarId: true, scheduledDate: true, updatedAt: true },
      }),
      // All active pillars
      prisma.contentPillar.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
      // Next 3 scheduled posts
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
      // Social metrics aggregate (last 30 days)
      prisma.postMetrics.aggregate({
        where: {
          publishedAt: { gte: thirtyDaysAgo },
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

    // Calculate consistency score (last 4 weeks)
    const consistencyScore = calculateConsistencyScore(allPosts);

    // Pipeline counts by status
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

    // Content mix by pillar
    const totalPosts = allPosts.length;
    const pillarCounts: Record<string, number> = {};
    for (const post of allPosts) {
      pillarCounts[post.pillarId] = (pillarCounts[post.pillarId] || 0) + 1;
    }

    const contentMix: PillarMixItem[] = pillars.map((pillar) => ({
      id: pillar.id,
      name: pillar.name,
      slug: pillar.slug,
      color: pillar.color,
      targetPercentage: pillar.targetPercentage,
      count: pillarCounts[pillar.id] || 0,
      percentage: totalPosts > 0
        ? Math.round(((pillarCounts[pillar.id] || 0) / totalPosts) * 100)
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

    // Results without post (simple heuristic - total results count)
    // A more sophisticated approach would track which results have been transformed
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
      postsThisMonth: publishedThisMonth,
      monthlyGoal: 16,
      consistencyScore,
      pipeline,
      contentMix,
      upcomingPosts: upcoming,
      resultsWithoutPost,
      metricsSummary,
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
  posts: Array<{ status: string; scheduledDate: Date | null; updatedAt: Date }>
): number {
  const publishedPosts = posts.filter((p) => p.status === 'PUBLISHED');
  if (publishedPosts.length === 0) return 0;

  const now = new Date();
  const weekScores: number[] = [];

  // Calculate score for last 4 weeks
  for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - weekOffset * 7);
    weekEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

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

  // Average of week scores
  const totalScore = weekScores.reduce((sum, s) => sum + s, 0);
  return Math.round(totalScore / weekScores.length);
}
