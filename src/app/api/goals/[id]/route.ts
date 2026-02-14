import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const body = await request.json() as {
      targetValue?: number;
      period?: string;
      endDate?: string;
      status?: string;
    };

    const updateData: Record<string, unknown> = {};

    if (body.targetValue !== undefined) updateData.targetValue = body.targetValue;
    if (body.period !== undefined) updateData.period = body.period;
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate);
    if (body.status !== undefined) updateData.status = body.status;

    const goal = await prisma.goal.update({
      where: { id },
      data: updateData,
      include: {
        socialAccount: {
          select: {
            id: true,
            platform: true,
            displayName: true,
            username: true,
            profilePictureUrl: true,
            followersCount: true,
          },
        },
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Failed to update goal:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { id } = await context.params;
    await prisma.goal.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete goal:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}
