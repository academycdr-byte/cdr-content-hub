import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import type { CalendarEntry, CalendarApiResponse, SocialPlatform } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10);
    const platformFilter = searchParams.get('platform') as SocialPlatform | null;
    const accountIdFilter = searchParams.get('accountId');

    // Date range for the month (with buffer for calendar display)
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Fetch internal posts (scheduled in this month)
    const internalPosts = await prisma.post.findMany({
      where: {
        createdById: userId,
        scheduledDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        contentPillar: true,
      },
      orderBy: { scheduledDate: 'asc' },
    });

    // Build social metrics query
    const socialWhere: Record<string, unknown> = {
      socialAccount: {
        userId,
        isActive: true,
      },
      publishedAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (platformFilter) {
      socialWhere.platform = platformFilter;
    }

    if (accountIdFilter) {
      socialWhere.socialAccountId = accountIdFilter;
    }

    // Fetch social posts (PostMetrics published in this month)
    const socialMetrics = await prisma.postMetrics.findMany({
      where: socialWhere,
      include: {
        socialAccount: {
          select: {
            id: true,
            platform: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: { publishedAt: 'asc' },
    });

    // Fetch user accounts for filter dropdown
    const accounts = await prisma.socialAccount.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        platform: true,
        username: true,
        displayName: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build unified entries grouped by date
    const entries: Record<string, CalendarEntry[]> = {};

    // Add internal posts (only if no platform filter is set, or explicitly showing all)
    if (!platformFilter) {
      for (const post of internalPosts) {
        if (!post.scheduledDate) continue;

        const dateKey = formatDateKey(post.scheduledDate);

        if (!entries[dateKey]) {
          entries[dateKey] = [];
        }

        entries[dateKey].push({
          id: post.id,
          type: 'internal',
          title: post.title,
          status: post.status,
          format: post.format,
          date: dateKey,
          pillarColor: post.contentPillar?.color,
          pillarName: post.contentPillar?.name,
        });
      }
    }

    // Add social metrics
    for (const metric of socialMetrics) {
      const dateKey = formatDateKey(metric.publishedAt);

      if (!entries[dateKey]) {
        entries[dateKey] = [];
      }

      const caption = metric.caption || '';
      const title = caption.length > 60 ? caption.substring(0, 57) + '...' : caption || 'Post sem legenda';

      entries[dateKey].push({
        id: metric.id,
        type: 'social',
        title,
        platform: metric.socialAccount.platform as SocialPlatform,
        accountName: metric.socialAccount.username,
        accountId: metric.socialAccount.id,
        thumbnailUrl: metric.thumbnailUrl || undefined,
        status: 'PUBLISHED',
        format: metric.mediaType || undefined,
        metrics: {
          views: metric.views,
          likes: metric.likes,
          comments: metric.comments,
        },
        date: dateKey,
        postUrl: metric.postUrl || undefined,
      });
    }

    // Sort entries within each day: internal (scheduled) first, then social
    for (const dateKey of Object.keys(entries)) {
      entries[dateKey].sort((a, b) => {
        if (a.type === 'internal' && b.type === 'social') return -1;
        if (a.type === 'social' && b.type === 'internal') return 1;
        return 0;
      });
    }

    const response: CalendarApiResponse = {
      entries,
      accounts: accounts.map((a) => ({
        id: a.id,
        platform: a.platform as SocialPlatform,
        username: a.username,
        displayName: a.displayName,
      })),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error(
      'Failed to fetch calendar data:',
      err instanceof Error ? err.message : 'Unknown'
    );
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
