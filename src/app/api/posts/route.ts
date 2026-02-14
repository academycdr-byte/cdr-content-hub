import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { generateId } from '@/lib/utils';

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
    const body = await request.json() as {
      title: string;
      format: string;
      pillarId: string;
      scheduledDate?: string;
      hook?: string;
      status?: string;
      body?: string;
    };

    if (!body.title || !body.format || !body.pillarId) {
      return NextResponse.json(
        { error: 'Titulo, formato e pilar sao obrigatorios' },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        id: generateId(),
        title: body.title,
        format: body.format,
        pillarId: body.pillarId,
        createdById: userId,
        status: body.status || 'IDEA',
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
        hook: body.hook || null,
        body: body.body || null,
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
