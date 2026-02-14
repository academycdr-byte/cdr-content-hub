import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// ===== Interfaces =====

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

// ===== Constants =====

const STATUS_COLORS: Record<string, string> = {
  IDEA: '#6E6E73',
  SCRIPT: '#2563EB',
  PRODUCTION: '#7C3AED',
  REVIEW: '#D97706',
  SCHEDULED: '#16A34A',
  PUBLISHED: '#4A7A00',
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  facebook: 'Facebook',
  twitter: 'Twitter/X',
};

const DEFAULT_CPM: Record<string, number> = {
  REEL: 2.0,
  CAROUSEL: 3.0,
  STATIC: 2.5,
  STORY: 1.5,
};

// ===== Helpers =====

function parseDateRange(request: NextRequest): { start: Date; end: Date; label: string } {
  const url = new URL(request.url);
  const startParam = url.searchParams.get('startDate');
  const endParam = url.searchParams.get('endDate');

  const now = new Date();

  if (startParam && endParam) {
    const start = new Date(startParam);
    const end = new Date(endParam);

    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(23, 59, 59, 999);
      return { start, end, label: 'custom' };
    }
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end, label: 'this_month' };
}

function getFormatFromMediaType(mediaType: string | null): string {
  if (!mediaType) return 'REEL';
  const mt = mediaType.toUpperCase();
  if (mt.includes('VIDEO') || mt.includes('REEL')) return 'REEL';
  if (mt.includes('CAROUSEL')) return 'CAROUSEL';
  if (mt.includes('IMAGE') || mt.includes('PHOTO')) return 'STATIC';
  if (mt.includes('STORY') || mt.includes('STORIES')) return 'STORY';
  return 'REEL';
}

function calculateCpm(
  views: number,
  mediaType: string | null,
  cpmMap: Record<string, number>
): number {
  const format = getFormatFromMediaType(mediaType);
  const cpm = cpmMap[format] || DEFAULT_CPM[format] || 2.0;
  return (views / 1000) * cpm;
}

function calculateConsistencyScore(
  posts: Array<{ status: string; scheduledDate: Date | null; updatedAt: Date }>,
  rangeStart: Date,
  rangeEnd: Date
): number {
  const publishedPosts = posts.filter((p) => p.status === 'PUBLISHED');
  if (publishedPosts.length === 0) return 0;

  const rangeMs = rangeEnd.getTime() - rangeStart.getTime();
  const rangeDays = Math.ceil(rangeMs / (1000 * 60 * 60 * 24));
  const numWeeks = Math.max(Math.ceil(rangeDays / 7), 1);
  const weeksToCalculate = Math.min(numWeeks, 12);

  const weekScores: number[] = [];

  for (let weekOffset = 0; weekOffset < weeksToCalculate; weekOffset++) {
    const weekStart = new Date(rangeStart);
    weekStart.setDate(rangeStart.getDate() + weekOffset * 7);
    weekStart.setUTCHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    if (weekStart > rangeEnd) break;
    if (weekEnd > rangeEnd) {
      weekEnd.setTime(rangeEnd.getTime());
    }

    const daysWithPosts = new Set<string>();
    for (const post of publishedPosts) {
      const postDate = post.scheduledDate || post.updatedAt;
      if (postDate >= weekStart && postDate <= weekEnd) {
        const dayKey = `${postDate.getFullYear()}-${postDate.getMonth()}-${postDate.getDate()}`;
        daysWithPosts.add(dayKey);
      }
    }

    const weekScore = Math.min((daysWithPosts.size / 4) * 100, 100);
    weekScores.push(weekScore);
  }

  if (weekScores.length === 0) return 0;

  const totalScore = weekScores.reduce((sum, s) => sum + s, 0);
  return Math.round(totalScore / weekScores.length);
}

// ===== Route Handler =====

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const userId = auth.session!.user.id;
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
      metricsInRange,
      socialAccounts,
      cpmConfigs,
    ] = await Promise.all([
      // Posts published in the selected range
      prisma.post.count({
        where: {
          status: 'PUBLISHED',
          createdById: userId,
          updatedAt: { gte: rangeStart, lte: rangeEnd },
        },
      }),
      // Posts created in range (for content mix)
      prisma.post.findMany({
        where: {
          createdById: userId,
          createdAt: { gte: rangeStart, lte: rangeEnd },
        },
        select: { id: true, status: true, pillarId: true, scheduledDate: true, updatedAt: true },
      }),
      // All posts for pipeline count and consistency
      prisma.post.findMany({
        where: { createdById: userId },
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
          createdById: userId,
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
          socialAccount: { userId },
        },
        _sum: {
          views: true,
          likes: true,
          comments: true,
          shares: true,
        },
        _count: true,
      }),
      // All individual post metrics in range (for breakdowns + top posts)
      prisma.postMetrics.findMany({
        where: {
          publishedAt: { gte: rangeStart, lte: rangeEnd },
          socialAccount: { userId },
        },
        select: {
          id: true,
          views: true,
          likes: true,
          comments: true,
          shares: true,
          platform: true,
          socialAccountId: true,
          mediaType: true,
          caption: true,
          thumbnailUrl: true,
          postUrl: true,
          publishedAt: true,
        },
      }),
      // User's social accounts
      prisma.socialAccount.findMany({
        where: { userId },
        select: { id: true, displayName: true, username: true, platform: true },
      }),
      // CPM configs for value calculation
      prisma.commissionConfig.findMany(),
    ]);

    // ===== Existing calculations =====

    const consistencyScore = calculateConsistencyScore(allPosts, rangeStart, rangeEnd);

    // Pipeline counts by status (global, not filtered by date)
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

    // Upcoming posts
    const upcoming: UpcomingPostItem[] = upcomingPosts.map((post) => ({
      id: post.id,
      title: post.title,
      scheduledDate: post.scheduledDate?.toISOString() || '',
      pillarName: post.contentPillar.name,
      pillarColor: post.contentPillar.color,
      format: post.format,
    }));

    // Metrics summary
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

    // ===== New calculations =====

    // Build CPM lookup from configs (fallback to defaults)
    const cpmMap: Record<string, number> = { ...DEFAULT_CPM };
    for (const config of cpmConfigs) {
      cpmMap[config.format] = config.cpmValue;
    }

    // Account lookup for display names
    const accountMap = new Map(socialAccounts.map((a) => [a.id, a]));

    // Platform breakdown
    const platformAcc: Record<string, PlatformBreakdown> = {};
    for (const m of metricsInRange) {
      if (!platformAcc[m.platform]) {
        platformAcc[m.platform] = {
          platform: m.platform,
          label: PLATFORM_LABELS[m.platform] || m.platform,
          postsCount: 0,
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          cpmValue: 0,
        };
      }
      const pd = platformAcc[m.platform];
      pd.postsCount++;
      pd.views += m.views;
      pd.likes += m.likes;
      pd.comments += m.comments;
      pd.shares += m.shares;
      pd.cpmValue += calculateCpm(m.views, m.mediaType, cpmMap);
    }

    // Profile breakdown
    const profileAcc: Record<string, ProfileBreakdown> = {};
    for (const m of metricsInRange) {
      if (!profileAcc[m.socialAccountId]) {
        const account = accountMap.get(m.socialAccountId);
        profileAcc[m.socialAccountId] = {
          accountId: m.socialAccountId,
          displayName: account?.displayName || 'Conta',
          username: account?.username || '',
          platform: account?.platform || m.platform,
          postsCount: 0,
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          cpmValue: 0,
        };
      }
      const pr = profileAcc[m.socialAccountId];
      pr.postsCount++;
      pr.views += m.views;
      pr.likes += m.likes;
      pr.comments += m.comments;
      pr.shares += m.shares;
      pr.cpmValue += calculateCpm(m.views, m.mediaType, cpmMap);
    }

    // Top posts by engagement (likes + comments + shares)
    const topPosts: TopPostItem[] = metricsInRange
      .map((m) => ({
        id: m.id,
        caption: m.caption || '',
        views: m.views,
        likes: m.likes,
        comments: m.comments,
        shares: m.shares,
        engagement: m.likes + m.comments + m.shares,
        platform: m.platform,
        thumbnailUrl: m.thumbnailUrl,
        postUrl: m.postUrl,
        publishedAt: m.publishedAt.toISOString(),
        mediaType: m.mediaType || '',
        accountName: accountMap.get(m.socialAccountId)?.displayName || '',
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5);

    // Total CPM value
    const totalCpmValue = metricsInRange.reduce(
      (sum, m) => sum + calculateCpm(m.views, m.mediaType, cpmMap),
      0
    );

    // ===== Build Response =====

    const stats: DashboardStats = {
      postsThisMonth: publishedInRange,
      monthlyGoal: 16,
      consistencyScore,
      pipeline,
      contentMix,
      upcomingPosts: upcoming,
      resultsWithoutPost: totalResults,
      metricsSummary,
      dateRange: {
        startDate: rangeStart.toISOString(),
        endDate: rangeEnd.toISOString(),
        label: rangeLabel,
      },
      totalCpmValue,
      platformBreakdown: Object.values(platformAcc).sort((a, b) => b.views - a.views),
      profileBreakdown: Object.values(profileAcc).sort((a, b) => b.views - a.views),
      topPosts,
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
