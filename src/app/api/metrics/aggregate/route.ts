import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as Record<string, unknown>).id as string;

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Build date filter
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.lte = toDate;
    }

    const where: Record<string, unknown> = {
      socialAccount: { userId },
    };
    if (Object.keys(dateFilter).length > 0) {
      where.publishedAt = dateFilter;
    }

    // Run all aggregations in parallel
    const [totalsResult, byPlatform, byAccount, topPosts] = await Promise.all([
      // Total aggregates
      prisma.postMetrics.aggregate({
        where,
        _sum: {
          views: true,
          likes: true,
          comments: true,
          shares: true,
        },
        _count: true,
      }),

      // Group by platform
      prisma.postMetrics.groupBy({
        by: ['platform'],
        where,
        _sum: {
          views: true,
          likes: true,
        },
        _count: true,
      }),

      // Group by socialAccountId (need to join with account after)
      prisma.postMetrics.groupBy({
        by: ['socialAccountId', 'platform'],
        where,
        _sum: {
          views: true,
        },
        _count: true,
      }),

      // Top posts by views
      prisma.postMetrics.findMany({
        where,
        orderBy: { views: 'desc' },
        take: 10,
        include: {
          socialAccount: {
            select: {
              id: true,
              username: true,
              displayName: true,
              platform: true,
            },
          },
        },
      }),
    ]);

    // Fetch account usernames for byAccount
    const accountIds = byAccount.map((a) => a.socialAccountId);
    const accounts = await prisma.socialAccount.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, username: true, platform: true },
    });
    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    return NextResponse.json({
      totals: {
        views: totalsResult._sum.views || 0,
        likes: totalsResult._sum.likes || 0,
        comments: totalsResult._sum.comments || 0,
        shares: totalsResult._sum.shares || 0,
        posts: totalsResult._count,
      },
      byPlatform: byPlatform.map((p) => ({
        platform: p.platform,
        views: p._sum.views || 0,
        likes: p._sum.likes || 0,
        posts: p._count,
      })),
      byAccount: byAccount.map((a) => {
        const acc = accountMap.get(a.socialAccountId);
        return {
          accountId: a.socialAccountId,
          username: acc?.username || '',
          platform: a.platform,
          views: a._sum.views || 0,
          posts: a._count,
        };
      }),
      topPosts,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao agregar metricas';
    console.error('Metrics aggregate error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
