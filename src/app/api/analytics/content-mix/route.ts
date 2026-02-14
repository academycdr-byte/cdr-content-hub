import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ContentMixPillar {
  id: string;
  name: string;
  slug: string;
  color: string;
  targetPercentage: number;
  count: number;
  percentage: number;
  deviation: number;
}

interface ContentMixResponse {
  pillars: ContentMixPillar[];
  totalPosts: number;
  recommendation: string | null;
  hasWarning: boolean;
}

export async function GET() {
  try {
    const [pillars, posts] = await Promise.all([
      prisma.contentPillar.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
      prisma.post.findMany({
        select: { pillarId: true },
      }),
    ]);

    const totalPosts = posts.length;

    // Count posts per pillar
    const pillarCounts: Record<string, number> = {};
    for (const post of posts) {
      pillarCounts[post.pillarId] = (pillarCounts[post.pillarId] || 0) + 1;
    }

    const pillarData: ContentMixPillar[] = pillars.map((pillar) => {
      const count = pillarCounts[pillar.id] || 0;
      const percentage = totalPosts > 0 ? Math.round((count / totalPosts) * 100) : 0;
      const deviation = percentage - pillar.targetPercentage;

      return {
        id: pillar.id,
        name: pillar.name,
        slug: pillar.slug,
        color: pillar.color,
        targetPercentage: pillar.targetPercentage,
        count,
        percentage,
        deviation,
      };
    });

    const hasWarning = pillarData.some((p) => Math.abs(p.deviation) > 15);

    // Find biggest negative deviation for recommendation
    const biggestNegative = pillarData
      .filter((p) => p.deviation < 0)
      .sort((a, b) => a.deviation - b.deviation)[0];

    const recommendation = biggestNegative
      ? `Voce precisa de mais ${biggestNegative.name} esta semana (desvio de ${Math.abs(biggestNegative.deviation)}% abaixo do alvo).`
      : null;

    const response: ContentMixResponse = {
      pillars: pillarData,
      totalPosts,
      recommendation,
      hasWarning,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch content mix:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to fetch content mix analytics' },
      { status: 500 }
    );
  }
}
