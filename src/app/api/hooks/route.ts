import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { generateId } from '@/lib/utils';
import { createHookSchema, parseBody } from '@/lib/validations';
import type { HookCategory } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { searchParams } = new URL(request.url);
    const pillarId = searchParams.get('pillarId');
    const format = searchParams.get('format');
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy');

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

    const orderBy = sortBy === 'performanceScore'
      ? [{ performanceScore: 'desc' as const }, { usageCount: 'desc' as const }]
      : [{ usageCount: 'desc' as const }, { text: 'asc' as const }];

    const hooks = await prisma.hook.findMany({
      where,
      include: {
        contentPillar: true,
      },
      orderBy,
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
    const raw = await request.json();

    const parsed = parseBody(createHookSchema, raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const body = parsed.data;

    const hook = await prisma.hook.create({
      data: {
        id: generateId(),
        text: body.text.trim(),
        scenes: body.scenes?.trim() || null,
        conclusion: body.conclusion?.trim() || null,
        pillarId: body.pillarId || null,
        format: body.format || 'ALL',
        category: (body.category || 'QUESTION') as HookCategory,
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
