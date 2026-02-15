import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { generateId } from '@/lib/utils';

const DEFAULT_CONFIGS = [
  { format: 'REEL', cpmValue: 2.0 },
  { format: 'CAROUSEL', cpmValue: 3.0 },
  { format: 'STATIC', cpmValue: 2.5 },
  { format: 'STORY', cpmValue: 1.5 },
];

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    let configs = await prisma.commissionConfig.findMany({
      orderBy: { format: 'asc' },
    });

    // If no configs exist, create defaults
    if (configs.length === 0) {
      await prisma.commissionConfig.createMany({
        data: DEFAULT_CONFIGS.map((c) => ({
          id: generateId(),
          format: c.format,
          cpmValue: c.cpmValue,
        })),
      });
      configs = await prisma.commissionConfig.findMany({
        orderBy: { format: 'asc' },
      });
    }

    return NextResponse.json(configs);
  } catch (error) {
    console.error('Failed to fetch CPM configs:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to fetch CPM configs' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json() as { format: string; cpmValue: number };

    if (!body.format || typeof body.cpmValue !== 'number' || body.cpmValue < 0) {
      return NextResponse.json(
        { error: 'Format e cpmValue (>= 0) sao obrigatorios' },
        { status: 400 }
      );
    }

    const config = await prisma.commissionConfig.upsert({
      where: { format: body.format },
      update: { cpmValue: body.cpmValue, updatedAt: new Date() },
      create: {
        id: generateId(),
        format: body.format,
        cpmValue: body.cpmValue,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to update CPM config:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to update CPM config' },
      { status: 500 }
    );
  }
}
