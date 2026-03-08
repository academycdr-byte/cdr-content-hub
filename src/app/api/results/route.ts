import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { generateId } from '@/lib/utils';
import { createResultSchema, parseBody } from '@/lib/validations';
import type { ResultImageType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { searchParams } = new URL(request.url);
    const clientName = searchParams.get('clientName');
    const metricType = searchParams.get('metricType');
    const clientNiche = searchParams.get('clientNiche');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const where: Record<string, unknown> = {};

    if (clientName) {
      where.clientName = { contains: clientName, mode: 'insensitive' };
    }
    if (metricType) {
      where.metricType = metricType;
    }
    if (clientNiche) {
      where.clientNiche = { contains: clientNiche, mode: 'insensitive' };
    }

    const [results, total] = await Promise.all([
      prisma.clientResult.findMany({
        where,
        include: { resultImages: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.clientResult.count({ where }),
    ]);

    return NextResponse.json({
      results,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Failed to fetch results:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const raw = await request.json();

    const parsed = parseBody(createResultSchema, raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const body = parsed.data;

    const result = await prisma.clientResult.create({
      data: {
        id: generateId(),
        clientName: body.clientName,
        clientNiche: body.clientNiche,
        metricType: body.metricType,
        metricValue: body.metricValue,
        metricUnit: body.metricUnit || '',
        period: body.period,
        description: body.description || '',
        testimonialText: body.testimonialText || null,
        resultImages: body.imageUrls && body.imageUrls.length > 0
          ? {
              create: body.imageUrls.map((img) => ({
                id: generateId(),
                url: img.url,
                altText: img.altText || '',
                type: (img.type || 'SCREENSHOT') as ResultImageType,
              })),
            }
          : undefined,
      },
      include: { resultImages: true },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to create result:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to create result' },
      { status: 500 }
    );
  }
}
