import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { updatePillarsSchema, parseBody } from '@/lib/validations';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    const where: Record<string, unknown> = { isActive: true };
    if (accountId) {
      where.socialAccountId = accountId;
    }

    const pillars = await prisma.contentPillar.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(pillars);
  } catch (error) {
    console.error('Failed to fetch pillars:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to fetch pillars' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const raw = await request.json();

    const parsed = parseBody(updatePillarsSchema, raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const body = parsed.data;

    // Validate total percentage = 100
    const totalPercentage = body.reduce((sum, p) => sum + p.targetPercentage, 0);
    if (totalPercentage !== 100) {
      return NextResponse.json(
        { error: 'A soma dos percentuais deve ser 100%' },
        { status: 400 }
      );
    }

    // Update each pillar in a transaction
    const updated = await prisma.$transaction(
      body.map((pillar) =>
        prisma.contentPillar.update({
          where: { id: pillar.id },
          data: {
            name: pillar.name,
            color: pillar.color,
            targetPercentage: pillar.targetPercentage,
            description: pillar.description,
            order: pillar.order,
          },
        })
      )
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update pillars:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to update pillars' },
      { status: 500 }
    );
  }
}
