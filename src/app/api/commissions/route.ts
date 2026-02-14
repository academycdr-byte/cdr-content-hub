import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { calculateCommissions } from '@/lib/commissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const userId = searchParams.get('userId');
    const isPaidParam = searchParams.get('isPaid');

    // Build where clause
    const where: Record<string, unknown> = {};
    if (month) where.monthReference = month;
    if (userId) where.userId = userId;
    if (isPaidParam === 'true') where.isPaid = true;
    if (isPaidParam === 'false') where.isPaid = false;

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        metric: {
          select: {
            id: true,
            views: true,
            likes: true,
            caption: true,
            mediaType: true,
            platform: true,
            postUrl: true,
            thumbnailUrl: true,
            publishedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate totals
    let totalAmount = 0;
    let paidAmount = 0;
    for (const c of commissions) {
      totalAmount += c.amount;
      if (c.isPaid) paidAmount += c.amount;
    }

    return NextResponse.json({
      data: commissions,
      stats: {
        total: Math.round(totalAmount * 100) / 100,
        paid: Math.round(paidAmount * 100) / 100,
        pending: Math.round((totalAmount - paidAmount) * 100) / 100,
        count: commissions.length,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao buscar comissoes';
    console.error('[API] commissions GET error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'calculate') {
      const { month } = body;
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json(
          { error: 'Mes invalido. Use formato YYYY-MM.' },
          { status: 400 }
        );
      }
      const result = await calculateCommissions(month);
      return NextResponse.json(result);
    }

    if (action === 'mark_paid') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 });
      }
      await prisma.commission.update({
        where: { id },
        data: { isPaid: true, paidAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'mark_unpaid') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 });
      }
      await prisma.commission.update({
        where: { id },
        data: { isPaid: false, paidAt: null },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'mark_all_paid') {
      const { userId: targetUserId, month } = body;
      if (!targetUserId || !month) {
        return NextResponse.json(
          { error: 'userId e month obrigatorios' },
          { status: 400 }
        );
      }
      await prisma.commission.updateMany({
        where: {
          userId: targetUserId,
          monthReference: month,
          isPaid: false,
        },
        data: { isPaid: true, paidAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acao invalida' }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao processar comissoes';
    console.error('[API] commissions POST error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
