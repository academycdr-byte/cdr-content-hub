import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const pillars = await prisma.contentPillar.findMany({
      where: { isActive: true },
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
    const body = await request.json() as Array<{
      id: string;
      name: string;
      color: string;
      targetPercentage: number;
      description: string;
      order: number;
    }>;

    // Validate total percentage = 100
    const totalPercentage = body.reduce(
      (sum: number, p: { targetPercentage: number }) => sum + p.targetPercentage,
      0
    );
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
