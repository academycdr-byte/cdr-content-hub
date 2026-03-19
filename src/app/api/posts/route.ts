import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { generateId } from '@/lib/utils';
import { createPostSchema, parseBody } from '@/lib/validations';
import type { PostFormat, PostStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // Format: YYYY-MM

    const search = searchParams.get('search');
    const where: Record<string, unknown> = {};

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (month) {
      const [year, m] = month.split('-').map(Number);
      // Use UTC dates to match scheduledDate stored as UTC midnight
      const startDate = new Date(Date.UTC(year, m - 1, 1));
      const endDate = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));
      where.scheduledDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    const raw = await prisma.post.findMany({
      where,
      include: {
        contentPillar: true,
        socialAccount: { select: { id: true, platform: true, username: true, displayName: true } },
      },
      orderBy: search ? { updatedAt: 'desc' } : { scheduledDate: 'asc' },
      ...(search ? { take: 20 } : {}),
    });

    // Map contentPillar → pillar to match frontend type
    const posts = raw.map(({ contentPillar, ...rest }) => ({ ...rest, pillar: contentPillar }));

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Failed to fetch posts:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const userId = auth.session!.user.id;
    const raw = await request.json();

    const parsed = parseBody(createPostSchema, raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const body = parsed.data;

    const post = await prisma.post.create({
      data: {
        id: generateId(),
        title: body.title,
        format: body.format as PostFormat,
        pillarId: body.pillarId,
        createdById: userId,
        status: (body.status || 'IDEA') as PostStatus,
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
        hook: body.hook || null,
        body: body.body || null,
        purpose: body.purpose || null,
        audience: body.audience || null,
        onlyIvan: body.onlyIvan || false,
        socialAccountId: body.socialAccountId || null,
        script: body.script || null,
        scriptMethod: body.scriptMethod || null,
        ctaKeyword: body.ctaKeyword || null,
        seriesId: body.seriesId || null,
        seriesEpisode: body.seriesEpisode || null,
        crossPostId: body.crossPostId || null,
        productionNotes: body.productionNotes || null,
      },
      include: {
        contentPillar: true,
        socialAccount: { select: { id: true, platform: true, username: true, displayName: true } },
        series: true,
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Failed to create post:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
