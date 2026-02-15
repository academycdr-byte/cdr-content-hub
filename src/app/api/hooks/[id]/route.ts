import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { id } = await context.params;

    await prisma.hook.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete hook:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to delete hook' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { id } = await context.params;
    const body = await request.json() as {
      text?: string;
      pillarId?: string | null;
      format?: string;
      category?: string;
      usageCount?: number;
      incrementUsage?: boolean;
    };

    const updateData: Record<string, unknown> = {};

    if (body.text !== undefined) {
      updateData.text = body.text;
    }
    if (body.pillarId !== undefined) {
      updateData.pillarId = body.pillarId;
    }
    if (body.format !== undefined) {
      updateData.format = body.format;
    }
    if (body.category !== undefined) {
      updateData.category = body.category;
    }
    if (body.incrementUsage) {
      updateData.usageCount = { increment: 1 };
    } else if (body.usageCount !== undefined) {
      updateData.usageCount = body.usageCount;
    }

    const hook = await prisma.hook.update({
      where: { id },
      data: updateData,
      include: { contentPillar: true },
    });

    return NextResponse.json(hook);
  } catch (error) {
    console.error('Failed to update hook:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to update hook' },
      { status: 500 }
    );
  }
}
