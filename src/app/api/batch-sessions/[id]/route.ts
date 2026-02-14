import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await prisma.batchSession.findUnique({
      where: { id },
      include: {
        posts: {
          include: { post: { include: { pillar: true } } },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to fetch batch session:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Failed to fetch batch session' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json() as {
      title?: string;
      scheduledDate?: string;
      notes?: string;
      status?: string;
      advancePostsStatus?: string;
    };

    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.scheduledDate !== undefined) updateData.scheduledDate = new Date(body.scheduledDate);
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.status !== undefined) updateData.status = body.status;

    const session = await prisma.batchSession.update({
      where: { id },
      data: updateData,
      include: {
        posts: {
          include: { post: { include: { pillar: true } } },
          orderBy: { order: 'asc' },
        },
      },
    });

    // If completing session and advancePostsStatus is set, update all posts
    if (body.status === 'COMPLETED' && body.advancePostsStatus) {
      const postIds = session.posts.map((sp) => sp.postId);
      if (postIds.length > 0) {
        await prisma.post.updateMany({
          where: { id: { in: postIds } },
          data: { status: body.advancePostsStatus },
        });
      }
    }

    // Re-fetch to get updated post statuses
    const updatedSession = await prisma.batchSession.findUnique({
      where: { id },
      include: {
        posts: {
          include: { post: { include: { pillar: true } } },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Failed to update batch session:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Failed to update batch session' }, { status: 500 });
  }
}
