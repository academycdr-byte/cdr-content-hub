import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { generateId } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { searchParams } = new URL(request.url);
    const pillarId = searchParams.get('pillarId');
    const format = searchParams.get('format');
    const category = searchParams.get('category');

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (pillarId) {
      where.pillarId = pillarId;
    }

    if (format && format !== 'ALL') {
      where.OR = [
        { format },
        { format: 'ALL' },
      ];
    }

    if (category) {
      where.category = category;
    }

    const hooks = await prisma.hook.findMany({
      where,
      include: {
        contentPillar: true,
      },
      orderBy: [
        { usageCount: 'desc' },
        { text: 'asc' },
      ],
    });

    return NextResponse.json(hooks);
  } catch (error) {
    console.error('Failed to fetch hooks:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to fetch hooks' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const body = await request.json() as {
      text: string;
      pillarId?: string | null;
      format?: string;
      category?: string;
    };

    if (!body.text?.trim()) {
      return NextResponse.json(
        { error: 'Texto do hook e obrigatorio' },
        { status: 400 }
      );
    }

    const hook = await prisma.hook.create({
      data: {
        id: generateId(),
        text: body.text.trim(),
        pillarId: body.pillarId || null,
        format: body.format || 'ALL',
        category: body.category || 'QUESTION',
      },
      include: {
        contentPillar: true,
      },
    });

    return NextResponse.json(hook, { status: 201 });
  } catch (error) {
    console.error('Failed to create hook:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to create hook' },
      { status: 500 }
    );
  }
}
