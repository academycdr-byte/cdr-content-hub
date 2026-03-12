import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { updateDmKeywordSchema, parseBody } from '@/lib/validations';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { id } = await context.params;

    const raw = await request.json();

    // Check if this is an increment request
    if (raw.increment === true) {
      const keyword = await prisma.dmKeyword.update({
        where: { id },
        data: {
          totalReceived: { increment: 1 },
          lastReceivedAt: new Date(),
        },
      });
      return NextResponse.json(keyword);
    }

    const parsed = parseBody(updateDmKeywordSchema, raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const body = parsed.data;

    const keyword = await prisma.dmKeyword.update({
      where: { id },
      data: {
        ...(body.description !== undefined && { description: body.description }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json(keyword);
  } catch (error) {
    console.error('Failed to update dm keyword:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Failed to update dm keyword' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { id } = await context.params;

    await prisma.dmKeyword.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete dm keyword:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Failed to delete dm keyword' }, { status: 500 });
  }
}
