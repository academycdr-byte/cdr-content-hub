import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

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
        include: { images: true },
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
    const body = await request.json() as {
      clientName: string;
      clientNiche: string;
      metricType: string;
      metricValue: string;
      metricUnit?: string;
      period: string;
      description?: string;
      testimonialText?: string;
      imageUrls?: { url: string; altText?: string; type?: string }[];
    };

    if (!body.clientName || !body.clientNiche || !body.metricType || !body.metricValue || !body.period) {
      return NextResponse.json(
        { error: 'clientName, clientNiche, metricType, metricValue e period sao obrigatorios' },
        { status: 400 }
      );
    }

    const result = await prisma.clientResult.create({
      data: {
        clientName: body.clientName,
        clientNiche: body.clientNiche,
        metricType: body.metricType,
        metricValue: body.metricValue,
        metricUnit: body.metricUnit || '',
        period: body.period,
        description: body.description || '',
        testimonialText: body.testimonialText || null,
        images: body.imageUrls && body.imageUrls.length > 0
          ? {
              create: body.imageUrls.map((img) => ({
                url: img.url,
                altText: img.altText || '',
                type: img.type || 'SCREENSHOT',
              })),
            }
          : undefined,
      },
      include: { images: true },
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
