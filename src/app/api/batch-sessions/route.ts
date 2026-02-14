import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions, requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const sessions = await prisma.batchSession.findMany({
      include: {
        posts: {
          include: { post: { include: { pillar: true } } },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { scheduledDate: 'desc' },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Failed to fetch batch sessions:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to fetch batch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json() as {
      title: string;
      scheduledDate: string;
      notes?: string;
    };

    if (!body.title || !body.scheduledDate) {
      return NextResponse.json(
        { error: 'title e scheduledDate sao obrigatorios' },
        { status: 400 }
      );
    }

    // Get user from session or use first available user
    const authSession = await getServerSession(authOptions);
    let createdById = (authSession?.user as Record<string, unknown> | undefined)?.id as string | undefined;

    if (!createdById) {
      const firstUser = await prisma.user.findFirst({ select: { id: true } });
      createdById = firstUser?.id;
    }

    if (!createdById) {
      return NextResponse.json(
        { error: 'Nenhum usuario encontrado. Crie um usuario primeiro.' },
        { status: 400 }
      );
    }

    const session = await prisma.batchSession.create({
      data: {
        title: body.title,
        scheduledDate: new Date(body.scheduledDate),
        notes: body.notes || null,
        status: 'PLANNED',
        createdById,
      },
      include: {
        posts: {
          include: { post: { include: { pillar: true } } },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Failed to create batch session:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to create batch session' },
      { status: 500 }
    );
  }
}
