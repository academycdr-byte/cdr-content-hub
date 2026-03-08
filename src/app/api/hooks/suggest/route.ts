import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { suggestHookSchema, parseBody } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const raw = await request.json();
    const parsed = parseBody(suggestHookSchema, raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const body = parsed.data;

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (body.pillarId) {
      where.OR = [
        { pillarId: body.pillarId },
        { pillarId: null },
      ];
    }

    if (body.format && body.format !== 'ALL') {
      // If we already have an OR for pillarId, we need to restructure
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          {
            OR: [
              { format: body.format },
              { format: 'ALL' },
            ],
          },
        ];
        delete where.OR;
      } else {
        where.OR = [
          { format: body.format },
          { format: 'ALL' },
        ];
      }
    }

    const hooks = await prisma.hook.findMany({
      where,
      include: {
        contentPillar: true,
      },
      orderBy: [
        { performanceScore: 'desc' },
        { usageCount: 'desc' },
      ],
      take: 5,
    });

    return NextResponse.json(hooks);
  } catch (error) {
    console.error('Failed to suggest hooks:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to suggest hooks' },
      { status: 500 }
    );
  }
}
