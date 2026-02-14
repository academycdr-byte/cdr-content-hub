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

    const now = new Date();
    const notifications: GeneratedNotification[] = [];

    // 1. Tokens sociais expirando em < 7 dias
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringAccounts = await prisma.socialAccount.findMany({
      where: {
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
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
          message: `"${post.title}" estava agendado para ${post.scheduledDate.toLocaleDateString('pt-BR')} e ainda nao foi publicado.`,
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

    // 3. Posts parados no mesmo status ha mais de 3 dias
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const stalePosts = await prisma.post.findMany({
      where: {
        updatedAt: {
          lt: threeDaysAgo,
        },
        status: {
          notIn: ['PUBLISHED', 'IDEA'],
        },
      },
      include: {
        contentPillar: true,
      },
      orderBy: { updatedAt: 'asc' },
      take: 10,
    });

    for (const post of stalePosts) {
      const daysStale = Math.floor(
        (now.getTime() - post.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      notifications.push({
        id: `stale-${post.id}`,
        type: 'info',
        title: 'Post parado',
        message: `"${post.title}" esta no status ${post.status} ha ${daysStale} dias sem atualizacao.`,
        createdAt: now.toISOString(),
        read: false,
      });
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
