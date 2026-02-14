import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { id } = await context.params;
    const body = await request.json() as {
      postId: string;
    };

    if (!body.postId) {
      return NextResponse.json(
        { error: 'postId e obrigatorio' },
        { status: 400 }
      );
    }

    // Check if session exists
    const session = await prisma.batchSession.findUnique({ where: { id } });
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get current max order
    const maxOrder = await prisma.batchSessionPost.findFirst({
      where: { sessionId: id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const sessionPost = await prisma.batchSessionPost.create({
      data: {
        sessionId: id,
        postId: body.postId,
        order: (maxOrder?.order ?? -1) + 1,
      },
      include: {
        post: { include: { pillar: true } },
      },
    });

    return NextResponse.json(sessionPost, { status: 201 });
  } catch (error) {
    console.error('Failed to add post to session:', error instanceof Error ? error.message : 'Unknown');

    // Handle unique constraint violation
    const errorMessage = error instanceof Error ? error.message : 'Unknown';
    if (errorMessage.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Post ja esta nesta sessao' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add post to session' },
      { status: 500 }
    );
  }
}
