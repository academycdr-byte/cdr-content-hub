import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const userId = auth.session.user.id;

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const platform = searchParams.get('platform');

    // Build where clause
    const where: Record<string, unknown> = {
      socialAccount: { userId },
    };

    if (from || to) {
      const publishedAt: Record<string, Date> = {};
      if (from) publishedAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setUTCHours(23, 59, 59, 999);
        publishedAt.lte = toDate;
      }
      where.publishedAt = publishedAt;
    }

    if (platform) {
      where.platform = platform;
    }

    const metrics = await prisma.postMetrics.findMany({
      where,
      include: {
        post: {
          select: { title: true },
        },
        socialAccount: {
          select: { username: true, platform: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    // Build CSV
    const header = 'Post,Plataforma,Views,Likes,Comentarios,Shares,Data';
    const rows = metrics.map((m) => {
      const postTitle = m.post?.title || m.caption?.slice(0, 50) || 'Sem titulo';
      // Escape CSV values that may contain commas or quotes
      const safeTitle = `"${postTitle.replace(/"/g, '""')}"`;
      const platformLabel = m.socialAccount?.platform || m.platform;
      const date = new Date(m.publishedAt).toLocaleDateString('pt-BR');
      return `${safeTitle},${platformLabel},${m.views},${m.likes},${m.comments},${m.shares},${date}`;
    });

    const csv = [header, ...rows].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="metricas-${from || 'inicio'}-${to || 'hoje'}.csv"`,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao exportar metricas';
    console.error('Metrics export error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
