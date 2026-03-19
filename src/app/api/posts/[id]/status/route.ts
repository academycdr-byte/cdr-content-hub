import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { postStatusSchema, parseBody } from '@/lib/validations';
import type { PostStatus } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { id } = await context.params;
    const raw = await request.json();

    const parsed = parseBody(postStatusSchema, raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const post = await prisma.post.update({
      where: { id },
      data: { status: parsed.data.status as PostStatus },
      include: { contentPillar: true, socialAccount: { select: { id: true, platform: true, username: true, displayName: true } } },
    });

    const { contentPillar, ...rest } = post;
    return NextResponse.json({ ...rest, pillar: contentPillar });
  } catch (error) {
    console.error('Failed to update post status:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to update post status' },
      { status: 500 }
    );
  }
}
