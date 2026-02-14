import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { id } = await context.params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: { contentPillar: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Failed to fetch post:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { id } = await context.params;
    const body = await request.json() as {
      title?: string;
      hook?: string;
      body?: string;
      caption?: string;
      hashtags?: string;
      format?: string;
      pillarId?: string;
      status?: string;
      scheduledDate?: string | null;
    };

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.hook !== undefined && { hook: body.hook }),
        ...(body.body !== undefined && { body: body.body }),
        ...(body.caption !== undefined && { caption: body.caption }),
        ...(body.hashtags !== undefined && { hashtags: body.hashtags }),
        ...(body.format !== undefined && { format: body.format }),
        ...(body.pillarId !== undefined && { pillarId: body.pillarId }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.scheduledDate !== undefined && {
          scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
        }),
      },
      include: { contentPillar: true },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('Failed to update post:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { id } = await context.params;
    const body = await request.json() as { scheduledDate?: string; status?: string };

    const updateData: Record<string, unknown> = {};

    if (body.scheduledDate !== undefined) {
      updateData.scheduledDate = new Date(body.scheduledDate);
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    const post = await prisma.post.update({
      where: { id },
      data: updateData,
      include: { contentPillar: true },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('Failed to patch post:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Failed to patch post' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { id } = await context.params;
    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete post:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
