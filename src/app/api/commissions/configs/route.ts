import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { ensureDefaultConfigs } from '@/lib/commissions';

const VALID_FORMATS = ['REEL', 'CAROUSEL', 'STATIC', 'STORY'];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureDefaultConfigs();
    const configs = await prisma.commissionConfig.findMany({
      orderBy: { format: 'asc' },
    });

    return NextResponse.json(configs);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao buscar configs';
    console.error('[API] commission configs GET error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { format, cpmValue } = body;

    if (!format || !VALID_FORMATS.includes(format)) {
      return NextResponse.json(
        { error: `Formato invalido. Use: ${VALID_FORMATS.join(', ')}` },
        { status: 400 }
      );
    }

    if (typeof cpmValue !== 'number' || cpmValue < 0) {
      return NextResponse.json(
        { error: 'Valor de CPM invalido. Deve ser >= 0.' },
        { status: 400 }
      );
    }

    const updated = await prisma.commissionConfig.upsert({
      where: { format },
      update: { cpmValue },
      create: { format, cpmValue },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao atualizar config';
    console.error('[API] commission configs PUT error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
