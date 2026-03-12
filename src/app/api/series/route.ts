import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { createSeriesSchema, parseBody } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const userId = auth.session!.user.id;

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    const where: Record<string, unknown> = {
      socialAccount: { userId },
    };
    if (accountId) {
      where.socialAccountId = accountId;
    }

    const series = await prisma.contentSeries.findMany({
      where,
      include: {
        socialAccount: { select: { id: true, platform: true, username: true, displayName: true } },
        _count: { select: { posts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(series);
  } catch (error) {
    console.error('Failed to fetch series:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const raw = await request.json();
    const parsed = parseBody(createSeriesSchema, raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const body = parsed.data;

    const series = await prisma.contentSeries.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description || '',
        socialAccountId: body.socialAccountId,
        frequency: body.frequency || 'weekly',
        totalEpisodes: body.totalEpisodes || null,
        color: body.color || '#6E6E73',
        icon: body.icon || null,
      },
      include: {
        socialAccount: { select: { id: true, platform: true, username: true, displayName: true } },
      },
    });

    return NextResponse.json(series, { status: 201 });
  } catch (error) {
    console.error('Failed to create series:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Failed to create series' }, { status: 500 });
  }
}
