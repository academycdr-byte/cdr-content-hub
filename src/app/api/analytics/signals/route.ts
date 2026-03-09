import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

interface Signal {
  type: 'sharing' | 'conversation' | 'pillar_gap' | 'format_strength' | 'consistency';
  severity: 'info' | 'warning' | 'alert';
  title: string;
  description: string;
  action: string;
  relatedPostId?: string;
}

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const signals: Signal[] = [];

    // Get metrics from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentMetrics = await prisma.postMetrics.findMany({
      where: {
        publishedAt: { gte: thirtyDaysAgo },
      },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            format: true,
            pillarId: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    if (recentMetrics.length === 0) {
      // No metrics signal
      signals.push({
        type: 'consistency',
        severity: 'warning',
        title: 'Sem dados de performance',
        description: 'Nenhuma métrica sincronizada nos ultimos 30 dias.',
        action: 'Conecte suas redes sociais e sincronize métricas',
      });

      return NextResponse.json(signals.slice(0, 5));
    }

    // Calculate averages
    const totalShares = recentMetrics.reduce((s, m) => s + m.shares, 0);
    const totalComments = recentMetrics.reduce((s, m) => s + m.comments, 0);
    const avgShares = totalShares / recentMetrics.length;
    const avgComments = totalComments / recentMetrics.length;

    // Signal 1: High sharing posts
    for (const metric of recentMetrics) {
      if (metric.shares > avgShares * 2 && signals.length < 5) {
        const postTitle = metric.post?.title || metric.caption?.substring(0, 40) || 'Post';
        signals.push({
          type: 'sharing',
          severity: 'info',
          title: `"${postTitle}" tem alto compartilhamento`,
          description: `${metric.shares} shares (média: ${Math.round(avgShares)}). Este tema ressoa com a audiencia.`,
          action: 'Crie mais conteúdo sobre este tema',
          relatedPostId: metric.post?.id || undefined,
        });
      }
    }

    // Signal 2: High comment posts
    for (const metric of recentMetrics) {
      if (metric.comments > avgComments * 2 && signals.length < 5) {
        const postTitle = metric.post?.title || metric.caption?.substring(0, 40) || 'Post';
        signals.push({
          type: 'conversation',
          severity: 'info',
          title: `"${postTitle}" gera muitas conversas`,
          description: `${metric.comments} comentários (média: ${Math.round(avgComments)}). Explore mais este ângulo.`,
          action: 'Crie um post aprofundando este tema',
          relatedPostId: metric.post?.id || undefined,
        });
      }
    }

    // Signal 3: Pillar coverage gaps
    const pillars = await prisma.contentPillar.findMany({
      where: { isActive: true },
    });

    const postsThisMonth = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { pillarId: true },
    });

    const totalPublished = postsThisMonth.length || 1;

    for (const pillar of pillars) {
      const pillarPosts = postsThisMonth.filter((p) => p.pillarId === pillar.id);
      const actualPercentage = (pillarPosts.length / totalPublished) * 100;

      if (actualPercentage < pillar.targetPercentage * 0.5 && signals.length < 5) {
        signals.push({
          type: 'pillar_gap',
          severity: 'warning',
          title: `Pilar "${pillar.name}" esta descoberto`,
          description: `Apenas ${Math.round(actualPercentage)}% dos posts (meta: ${pillar.targetPercentage}%).`,
          action: `Crie mais conteúdo de ${pillar.name}`,
        });
      }
    }

    // Signal 4: Format strength
    const formatMetrics = new Map<string, { views: number; count: number }>();
    for (const metric of recentMetrics) {
      const format = metric.post?.format || metric.mediaType || 'UNKNOWN';
      const existing = formatMetrics.get(format) || { views: 0, count: 0 };
      existing.views += metric.views;
      existing.count += 1;
      formatMetrics.set(format, existing);
    }

    let bestFormat = '';
    let bestAvgViews = 0;
    for (const [format, data] of formatMetrics.entries()) {
      const avg = data.views / data.count;
      if (avg > bestAvgViews) {
        bestAvgViews = avg;
        bestFormat = format;
      }
    }

    if (bestFormat && formatMetrics.size > 1 && signals.length < 5) {
      signals.push({
        type: 'format_strength',
        severity: 'info',
        title: `${bestFormat} e seu ponto forte`,
        description: `Média de ${Math.round(bestAvgViews).toLocaleString()} views por post neste formato.`,
        action: `Priorize conteúdo em formato ${bestFormat}`,
      });
    }

    // Signal 5: Consistency check - no posts this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const postsThisWeek = await prisma.post.count({
      where: {
        createdAt: { gte: oneWeekAgo },
      },
    });

    if (postsThisWeek === 0 && signals.length < 5) {
      signals.push({
        type: 'consistency',
        severity: 'alert',
        title: 'Consistencia em risco',
        description: '0 posts criados esta semana. A consistencia e fundamental para o crescimento.',
        action: 'Crie pelo menos 3 posts esta semana',
      });
    }

    return NextResponse.json(signals.slice(0, 5));
  } catch (error) {
    console.error('Failed to generate signals:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to generate signals' },
      { status: 500 }
    );
  }
}
