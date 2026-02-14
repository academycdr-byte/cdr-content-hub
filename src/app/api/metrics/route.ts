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
    const platform = searchParams.get('platform');
    const accountId = searchParams.get('accountId');
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
    const offset = Number(searchParams.get('offset')) || 0;

    // Build where clause
    const where: Record<string, unknown> = {
      socialAccount: { userId },
    };

    if (from || to) {
      const publishedAt: Record<string, Date> = {};
      if (from) publishedAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        publishedAt.lte = toDate;
      }
      where.publishedAt = publishedAt;
    }

    if (platform) {
      where.platform = platform;
    }

    if (accountId) {
      where.socialAccountId = accountId;
    }

    const [metrics, total] = await Promise.all([
      prisma.postMetrics.findMany({
        where,
        include: {
          socialAccount: {
            select: {
              id: true,
              username: true,
              displayName: true,
              platform: true,
              profilePictureUrl: true,
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.postMetrics.count({ where }),
    ]);

    return NextResponse.json({
      data: metrics,
      total,
      limit,
      offset,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao buscar metricas';
    console.error('Metrics fetch error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
