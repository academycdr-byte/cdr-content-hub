import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const templates = await prisma.checklistTemplate.findMany({
      orderBy: { stage: 'asc' },
    });

    // Parse items from JSON string
    const parsed = templates.map((t) => ({
      id: t.id,
      stage: t.stage,
      items: JSON.parse(t.items) as string[],
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Failed to fetch checklist templates:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to fetch checklist templates' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as Array<{
      id: string;
      stage: string;
      items: string[];
    }>;

    const updated = await prisma.$transaction(
      body.map((template) =>
        prisma.checklistTemplate.update({
          where: { id: template.id },
          data: {
            items: JSON.stringify(template.items),
          },
        })
      )
    );

    const parsed = updated.map((t) => ({
      id: t.id,
      stage: t.stage,
      items: JSON.parse(t.items) as string[],
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Failed to update checklist templates:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to update checklist templates' },
      { status: 500 }
    );
  }
}
