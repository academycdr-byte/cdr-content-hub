import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { createIdeaSchema, parseBody } from '@/lib/validations';

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const ideas = await prisma.ideationIdea.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(ideas);
  } catch (error) {
    console.error('Failed to fetch ideas:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to fetch ideas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const raw = await request.json();
    const parsed = parseBody(createIdeaSchema, raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const body = parsed.data;

    const idea = await prisma.ideationIdea.create({
      data: {
        text: body.text.trim(),
        pillarId: body.pillarId || null,
      },
    });

    return NextResponse.json(idea, { status: 201 });
  } catch (error) {
    console.error('Failed to create idea:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to create idea' },
      { status: 500 }
    );
  }
}
