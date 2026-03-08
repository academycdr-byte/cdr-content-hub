import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    // Get all hooks
    const hooks = await prisma.hook.findMany({
      where: { isActive: true },
    });

    // Get all posts with their metrics, filtering by hook text match
    const posts = await prisma.post.findMany({
      where: {
        hook: { not: null },
      },
      select: {
        id: true,
        hook: true,
        postMetrics: {
          select: {
            views: true,
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
    });

    let updated = 0;

    for (const hook of hooks) {
      // Find posts that used this hook (by matching hook text)
      const matchingPosts = posts.filter(
        (p) => p.hook && p.hook.toLowerCase().includes(hook.text.toLowerCase().substring(0, 30))
      );

      if (matchingPosts.length === 0) continue;

      // Aggregate metrics from matched posts
      const allMetrics = matchingPosts.flatMap((p) => p.postMetrics);

      if (allMetrics.length === 0) continue;

      const totalShares = allMetrics.reduce((sum, m) => sum + m.shares, 0);
      const totalViews = allMetrics.reduce((sum, m) => sum + m.views, 0);
      const totalLikes = allMetrics.reduce((sum, m) => sum + m.likes, 0);
      const totalComments = allMetrics.reduce((sum, m) => sum + m.comments, 0);
      const count = allMetrics.length;

      const avgShares = totalShares / count;
      // Use shares as proxy for saves (saves are not tracked separately)
      const avgSaves = avgShares * 0.5;

      // Performance score: weighted combination
      // Views (30%) + Likes (20%) + Comments (25%) + Shares (25%)
      const normalizedViews = totalViews / count;
      const normalizedLikes = totalLikes / count;
      const normalizedComments = totalComments / count;
      const normalizedShares = totalShares / count;

      const performanceScore = Math.round(
        (normalizedViews * 0.3 +
          normalizedLikes * 0.2 +
          normalizedComments * 0.25 +
          normalizedShares * 0.25) /
          10
      );

      await prisma.hook.update({
        where: { id: hook.id },
        data: {
          avgShares: Math.round(avgShares * 100) / 100,
          avgSaves: Math.round(avgSaves * 100) / 100,
          performanceScore: Math.min(performanceScore, 100),
        },
      });

      updated++;
    }

    return NextResponse.json({
      message: `Performance scores updated for ${updated} hooks`,
      updated,
    });
  } catch (error) {
    console.error('Failed to update hook performance:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to update hook performance' },
      { status: 500 }
    );
  }
}
