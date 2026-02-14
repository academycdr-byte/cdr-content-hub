import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string; postId: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id, postId } = await context.params;

    await prisma.batchSessionPost.deleteMany({
      where: {
        sessionId: id,
        postId: postId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove post from session:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to remove post from session' },
      { status: 500 }
    );
  }
}
