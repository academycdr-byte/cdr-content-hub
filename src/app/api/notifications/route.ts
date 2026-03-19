import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

interface GeneratedNotification {
  id: string;
  type: 'warning' | 'info' | 'error';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const userId = auth.session!.user.id;

    const now = new Date();
    const notifications: GeneratedNotification[] = [];

    // 1. Tokens sociais expirando em < 7 dias
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringAccounts = await prisma.socialAccount.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          {
            tokenExpiresAt: {
              not: null,
              lt: sevenDaysFromNow,
              gt: now,
            },
          },
          {
            tiktokExpiresAt: {
              not: null,
              lt: sevenDaysFromNow,
              gt: now,
            },
          },
        ],
      },
      select: {
        id: true,
        platform: true,
        username: true,
        tokenExpiresAt: true,
        tiktokExpiresAt: true,
      },
    });

    for (const account of expiringAccounts) {
      const expiresAt = account.platform === 'tiktok'
        ? account.tiktokExpiresAt
        : account.tokenExpiresAt;

      if (expiresAt) {
        const daysLeft = Math.ceil(
          (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        notifications.push({
          id: `token-${account.id}`,
          type: 'warning',
          title: 'Token expirando',
          message: `O token do ${account.platform} (@${account.username}) expira em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}. Reconecte a conta.`,
          createdAt: now.toISOString(),
          read: false,
        });
      }
    }

    // Check for already expired tokens
    const expiredAccounts = await prisma.socialAccount.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          {
            tokenExpiresAt: {
              not: null,
              lt: now,
            },
          },
          {
            tiktokExpiresAt: {
              not: null,
              lt: now,
            },
          },
        ],
      },
      select: {
        id: true,
        platform: true,
        username: true,
      },
    });

    for (const account of expiredAccounts) {
      notifications.push({
        id: `token-expired-${account.id}`,
        type: 'error',
        title: 'Token expirado',
        message: `O token do ${account.platform} (@${account.username}) expirou. Reconecte a conta para continuar sincronizando.`,
        createdAt: now.toISOString(),
        read: false,
      });
    }

    // 2. Posts com scheduledDate hoje ou atrasados e status != PUBLISHED
    // Use UTC dates to match scheduledDate stored as UTC midnight
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const overdueOrTodayPosts = await prisma.post.findMany({
      where: {
        scheduledDate: {
          not: null,
          lte: todayEnd,
        },
        status: {
          not: 'PUBLISHED',
        },
      },
      include: {
        contentPillar: true,
      },
      orderBy: { scheduledDate: 'asc' },
      take: 20,
    });

    for (const post of overdueOrTodayPosts) {
      if (!post.scheduledDate) continue;

      const isToday =
        post.scheduledDate >= todayStart && post.scheduledDate < todayEnd;
      const isOverdue = post.scheduledDate < todayStart;

      if (isOverdue) {
        notifications.push({
          id: `overdue-${post.id}`,
          type: 'error',
          title: 'Post atrasado',
          message: `"${post.title}" estava agendado para ${post.scheduledDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' })} e ainda nao foi publicado.`,
          createdAt: now.toISOString(),
          read: false,
        });
      } else if (isToday) {
        notifications.push({
          id: `today-${post.id}`,
          type: 'warning',
          title: 'Post para hoje',
          message: `"${post.title}" esta agendado para hoje e esta com status ${post.status}.`,
          createdAt: now.toISOString(),
          read: false,
        });
      }
    }

    // 3. Posts parados no mesmo status ha mais de 5 dias (pipeline_stuck)
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const stalePosts = await prisma.post.findMany({
      where: {
        updatedAt: { lt: fiveDaysAgo },
        status: { notIn: ['PUBLISHED', 'IDEA'] },
      },
      include: { contentPillar: true },
      orderBy: { updatedAt: 'asc' },
      take: 10,
    });

    for (const post of stalePosts) {
      const daysStale = Math.floor(
        (now.getTime() - post.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      notifications.push({
        id: `stale-${post.id}`,
        type: daysStale > 7 ? 'warning' : 'info',
        title: 'Post parado no pipeline',
        message: `"${post.title}" esta no status ${post.status} ha ${daysStale} dias sem atualizacao.`,
        createdAt: now.toISOString(),
        read: false,
      });
    }

    // 4. Goals at risk (< 50% progress na metade do periodo)
    const activeGoals = await prisma.goal.findMany({
      where: { status: 'active', socialAccount: { userId } },
      include: { socialAccount: { select: { displayName: true, followersCount: true } } },
    });

    for (const goal of activeGoals) {
      const startDate = new Date(goal.startDate);
      const endDate = new Date(goal.endDate);
      const totalMs = endDate.getTime() - startDate.getTime();
      const elapsedMs = now.getTime() - startDate.getTime();
      const timeProgress = totalMs > 0 ? (elapsedMs / totalMs) * 100 : 0;

      const currentVal = goal.metricType === 'followers' ? goal.socialAccount.followersCount : goal.currentValue;
      const range = goal.targetValue - goal.startValue;
      const goalProgress = range > 0 ? ((currentVal - goal.startValue) / range) * 100 : 0;

      if (timeProgress > 50 && goalProgress < 50) {
        notifications.push({
          id: `goal-risk-${goal.id}`,
          type: 'warning',
          title: 'Meta em risco',
          message: `Meta de ${goal.metricType} (${goal.socialAccount.displayName}): ${Math.round(goalProgress)}% progresso com ${Math.round(timeProgress)}% do tempo.`,
          createdAt: now.toISOString(),
          read: false,
        });
      }
    }

    // 5. Series overdue
    const activeSeries = await prisma.contentSeries.findMany({
      where: { isActive: true, socialAccount: { userId } },
      include: {
        socialAccount: { select: { displayName: true } },
        posts: {
          where: { status: 'PUBLISHED' },
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { updatedAt: true, scheduledDate: true },
        },
      },
    });

    const FREQ_DAYS: Record<string, number> = { weekly: 7, biweekly: 14, monthly: 30, variable: 60 };
    for (const s of activeSeries) {
      const lastPost = s.posts[0];
      if (!lastPost) continue;
      const lastDate = lastPost.scheduledDate || lastPost.updatedAt;
      const daysSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      const maxDays = (FREQ_DAYS[s.frequency] || 30) * 1.5;
      if (daysSince > maxDays) {
        notifications.push({
          id: `series-overdue-${s.id}`,
          type: 'warning',
          title: 'Serie atrasada',
          message: `"${s.name}": ultimo episodio publicado ha ${Math.round(daysSince)} dias.`,
          createdAt: now.toISOString(),
          read: false,
        });
      }
    }

    // 6. Posting gap (> 3 dias sem publicar em algum perfil)
    const accounts = await prisma.socialAccount.findMany({
      where: { userId, isActive: true },
      select: { id: true, displayName: true, username: true },
    });
    for (const acc of accounts) {
      const lastPublished = await prisma.post.findFirst({
        where: { socialAccountId: acc.id, status: 'PUBLISHED' },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      });
      if (lastPublished) {
        const daysSince = (now.getTime() - lastPublished.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > 3) {
          notifications.push({
            id: `gap-${acc.id}`,
            type: daysSince > 5 ? 'error' : 'warning',
            title: 'Gap de postagem',
            message: `Faz ${Math.round(daysSince)} dias sem postar no @${acc.username}.`,
            createdAt: now.toISOString(),
            read: false,
          });
        }
      }
    }

    // Sort: errors first, then warnings, then info
    const typePriority: Record<string, number> = { error: 0, warning: 1, info: 2 };
    notifications.sort(
      (a, b) => (typePriority[a.type] ?? 3) - (typePriority[b.type] ?? 3)
    );

    return NextResponse.json(notifications);
  } catch (error) {
    console.error(
      'Failed to generate notifications:',
      error instanceof Error ? error.message : 'Unknown'
    );
    return NextResponse.json(
      { error: 'Failed to generate notifications' },
      { status: 500 }
    );
  }
}
