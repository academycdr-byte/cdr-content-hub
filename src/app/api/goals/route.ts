import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const userId = auth.session!.user.id;

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const accountId = searchParams.get('accountId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};

    if (accountId) {
      where.socialAccountId = accountId;
    }
    if (status) {
      where.status = status;
    }
    // Always filter by user's social accounts
    where.socialAccount = {
      userId,
      ...(platform ? { platform } : {}),
    };

    const goals = await prisma.goal.findMany({
      where,
      include: {
        socialAccount: {
          select: {
            id: true,
            platform: true,
            displayName: true,
            username: true,
            profilePictureUrl: true,
            followersCount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate progress and days remaining for each goal
    const now = new Date();
    const goalsWithProgress = goals.map((goal) => {
      const currentValue = goal.socialAccount.followersCount;
      const range = goal.targetValue - goal.startValue;
      const progress = range > 0
        ? Math.min(Math.round(((currentValue - goal.startValue) / range) * 100), 100)
        : 0;

      const endDate = new Date(goal.endDate);
      const diffMs = endDate.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      return {
        ...goal,
        currentValue,
        progress: Math.max(0, progress),
        daysRemaining,
      };
    });

    return NextResponse.json(goalsWithProgress);
  } catch (error) {
    console.error('Failed to fetch goals:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const userId = auth.session!.user.id;

    const body = await request.json() as {
      socialAccountId: string;
      metricType?: string;
      targetValue: number;
      period: string;
      endDate: string;
    };

    if (!body.socialAccountId || !body.targetValue || !body.period || !body.endDate) {
      return NextResponse.json(
        { error: 'socialAccountId, targetValue, period e endDate sao obrigatorios' },
        { status: 400 }
      );
    }

    // Get current followers count for startValue
    const account = await prisma.socialAccount.findUnique({
      where: { id: body.socialAccountId },
      select: { followersCount: true, userId: true },
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Conta social nao encontrada' },
        { status: 404 }
      );
    }

    if (account.userId !== userId) {
      return NextResponse.json(
        { error: 'Conta social nao pertence ao usuario' },
        { status: 403 }
      );
    }

    const goal = await prisma.goal.create({
      data: {
        socialAccountId: body.socialAccountId,
        metricType: body.metricType || 'followers',
        targetValue: body.targetValue,
        currentValue: account.followersCount,
        startValue: account.followersCount,
        period: body.period,
        endDate: new Date(body.endDate),
        status: 'active',
      },
      include: {
        socialAccount: {
          select: {
            id: true,
            platform: true,
            displayName: true,
            username: true,
            profilePictureUrl: true,
            followersCount: true,
          },
        },
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Failed to create goal:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}
