import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    // Build where clause
    const where: Record<string, unknown> = {};
    if (month) where.monthReference = month;

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        user: {
          select: { name: true },
        },
        metric: {
          select: {
            views: true,
            platform: true,
            caption: true,
            publishedAt: true,
            post: {
              select: { title: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate CPM for each commission
    const header = 'Usuario,Post,Views,CPM,Valor Comissao,Mes,Status Pagamento';
    const rows = commissions.map((c) => {
      const userName = c.user?.name || 'Desconhecido';
      const safeUserName = `"${userName.replace(/"/g, '""')}"`;

      const postTitle = c.metric?.post?.title || c.metric?.caption?.slice(0, 50) || 'Sem titulo';
      const safePostTitle = `"${postTitle.replace(/"/g, '""')}"`;

      const views = c.metric?.views || 0;
      const cpm = views > 0 ? ((c.amount / views) * 1000).toFixed(2) : '0.00';
      const amount = c.amount.toFixed(2);
      const monthRef = c.monthReference;
      const status = c.isPaid ? 'Pago' : 'Pendente';

      return `${safeUserName},${safePostTitle},${views},${cpm},${amount},${monthRef},${status}`;
    });

    const csv = [header, ...rows].join('\n');
    const filename = month ? `comissoes-${month}.csv` : 'comissoes.csv';

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao exportar comissoes';
    console.error('Commissions export error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
