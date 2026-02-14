import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { generateId } from '@/lib/utils';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { id } = await context.params;
    const result = await prisma.clientResult.findUnique({
      where: { id },
      include: { resultImages: true },
    });

    if (!result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch result:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Failed to fetch result' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { id } = await context.params;
    const body = await request.json() as {
      clientName?: string;
      clientNiche?: string;
      metricType?: string;
      metricValue?: string;
      metricUnit?: string;
      period?: string;
      description?: string;
      testimonialText?: string | null;
      imageUrls?: { url: string; altText?: string; type?: string }[];
    };

    const updateData: Record<string, unknown> = {};

    if (body.clientName !== undefined) updateData.clientName = body.clientName;
    if (body.clientNiche !== undefined) updateData.clientNiche = body.clientNiche;
    if (body.metricType !== undefined) updateData.metricType = body.metricType;
    if (body.metricValue !== undefined) updateData.metricValue = body.metricValue;
    if (body.metricUnit !== undefined) updateData.metricUnit = body.metricUnit;
    if (body.period !== undefined) updateData.period = body.period;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.testimonialText !== undefined) updateData.testimonialText = body.testimonialText;

    // If imageUrls provided, replace all images
    if (body.imageUrls !== undefined) {
      await prisma.resultImage.deleteMany({ where: { resultId: id } });
      if (body.imageUrls.length > 0) {
        await prisma.resultImage.createMany({
          data: body.imageUrls.map((img) => ({
            id: generateId(),
            resultId: id,
            url: img.url,
            altText: img.altText || '',
            type: img.type || 'SCREENSHOT',
          })),
        });
      }
    }

    const result = await prisma.clientResult.update({
      where: { id },
      data: updateData,
      include: { resultImages: true },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to update result:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Failed to update result' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { id } = await context.params;
    await prisma.clientResult.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete result:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Failed to delete result' }, { status: 500 });
  }
}
