import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const nextWeekStart = new Date();
    const nextWeekEnd = new Date();
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

    // Top 5 posts last 7 days by shares + comments (not likes)
    const recentMetrics = await prisma.postMetrics.findMany({
      where: {
        publishedAt: { gte: sevenDaysAgo },
      },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            format: true,
            pillarId: true,
            contentPillar: true,
          },
        },
      },
      orderBy: [
        { shares: 'desc' },
        { comments: 'desc' },
      ],
      take: 20,
    });

    // Sort by shares + comments combined and take top 5
    const topPosts = recentMetrics
      .sort((a, b) => (b.shares + b.comments) - (a.shares + a.comments))
      .slice(0, 5)
      .map((m) => ({
        id: m.id,
        postId: m.post?.id || null,
        title: m.post?.title || m.caption?.substring(0, 60) || 'Post sem titulo',
        format: m.post?.format || m.mediaType || 'UNKNOWN',
        pillarName: m.post?.contentPillar?.name || null,
        pillarColor: m.post?.contentPillar?.color || null,
        views: m.views,
        likes: m.likes,
        comments: m.comments,
        shares: m.shares,
        platform: m.platform,
        publishedAt: m.publishedAt.toISOString(),
      }));

    // Pillars that don't have posts scheduled next week
    const allPillars = await prisma.contentPillar.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    const scheduledNextWeek = await prisma.post.findMany({
      where: {
        scheduledDate: {
          gte: nextWeekStart,
          lte: nextWeekEnd,
        },
        status: { not: 'PUBLISHED' },
      },
      select: { pillarId: true },
    });

    const scheduledPillarIds = new Set(scheduledNextWeek.map((p) => p.pillarId));

    const uncoveredPillars = allPillars
      .filter((p) => !scheduledPillarIds.has(p.id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        targetPercentage: p.targetPercentage,
      }));

    // Suggested hooks for uncovered pillars
    const uncoveredPillarIds = uncoveredPillars.map((p) => p.id);

    const suggestedHooks = uncoveredPillarIds.length > 0
      ? await prisma.hook.findMany({
          where: {
            isActive: true,
            OR: [
              { pillarId: { in: uncoveredPillarIds } },
              { pillarId: null },
            ],
          },
          include: {
            contentPillar: true,
          },
          orderBy: [
            { performanceScore: 'desc' },
            { usageCount: 'desc' },
          ],
          take: 10,
        })
      : [];

    return NextResponse.json({
      topPosts,
      uncoveredPillars,
      suggestedHooks: suggestedHooks.map((h) => ({
        id: h.id,
        text: h.text,
        pillarId: h.pillarId,
        pillarName: h.contentPillar?.name || 'Universal',
        pillarColor: h.contentPillar?.color || '#6E6E73',
        format: h.format,
        category: h.category,
        performanceScore: h.performanceScore,
        usageCount: h.usageCount,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch ideation context:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to fetch ideation context' },
      { status: 500 }
    );
  }
}
