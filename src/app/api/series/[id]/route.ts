import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { updateSeriesSchema, parseBody } from '@/lib/validations';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { id } = await context.params;

    const series = await prisma.contentSeries.findUnique({
      where: { id },
      include: {
        socialAccount: { select: { id: true, platform: true, username: true, displayName: true } },
        posts: {
          orderBy: { seriesEpisode: 'asc' },
          select: { id: true, title: true, status: true, seriesEpisode: true, scheduledDate: true, format: true },
        },
      },
    });

    if (!series) {
      return NextResponse.json({ error: 'Serie nao encontrada' }, { status: 404 });
    }

    return NextResponse.json(series);
  } catch (error) {
    console.error('Failed to fetch series:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { id } = await context.params;

    const raw = await request.json();
    const parsed = parseBody(updateSeriesSchema, raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const body = parsed.data;

    const series = await prisma.contentSeries.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.frequency !== undefined && { frequency: body.frequency }),
        ...(body.totalEpisodes !== undefined && { totalEpisodes: body.totalEpisodes }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      include: {
        socialAccount: { select: { id: true, platform: true, username: true, displayName: true } },
      },
    });

    return NextResponse.json(series);
  } catch (error) {
    console.error('Failed to update series:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Failed to update series' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { id } = await context.params;

    await prisma.contentSeries.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete series:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Failed to delete series' }, { status: 500 });
  }
}
