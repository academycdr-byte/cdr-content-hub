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
      const startDate = new Date(year, m - 1, 1);
      const endDate = new Date(year, m, 0);
      where.scheduledDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        contentPillar: true,
      },
      orderBy: search ? { updatedAt: 'desc' } : { scheduledDate: 'asc' },
      ...(search ? { take: 20 } : {}),
    });

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
      },
      include: {
        contentPillar: true,
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
