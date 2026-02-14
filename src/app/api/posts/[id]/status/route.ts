import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const VALID_STATUSES = ['IDEA', 'SCRIPT', 'PRODUCTION', 'REVIEW', 'SCHEDULED', 'PUBLISHED'];

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json() as { status: string };

    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: 'Status invalido. Valores aceitos: ' + VALID_STATUSES.join(', ') },
        { status: 400 }
      );
    }

    const post = await prisma.post.update({
      where: { id },
      data: { status: body.status },
      include: { pillar: true },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('Failed to update post status:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to update post status' },
      { status: 500 }
    );
  }
}
