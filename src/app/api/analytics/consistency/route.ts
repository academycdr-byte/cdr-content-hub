import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface HeatmapDay {
  date: string;
  count: number;
  level: number; // 0=none, 1=light, 2=medium, 3=dark
}

interface Badge {
  id: string;
  label: string;
  icon: string;
  earned: boolean;
  description: string;
}

interface ConsistencyResponse {
  currentStreak: number;
  longestStreak: number;
  weeklyScore: number;
  monthlyScore: number;
  totalPublished: number;
  heatmapData: HeatmapDay[];
  badges: Badge[];
}

export async function GET() {
  try {
    const publishedPosts = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        scheduledDate: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const totalPublished = publishedPosts.length;

    // Build a map of dates with post counts
    const dateCountMap: Record<string, number> = {};
    for (const post of publishedPosts) {
      const date = post.scheduledDate || post.updatedAt;
      const dateKey = formatDateKey(date);
      dateCountMap[dateKey] = (dateCountMap[dateKey] || 0) + 1;
    }

    // Generate heatmap data for last 90 days
    const now = new Date();
    const heatmapData: HeatmapDay[] = [];

    for (let i = 89; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateKey = formatDateKey(date);
      const count = dateCountMap[dateKey] || 0;

      heatmapData.push({
        date: dateKey,
        count,
        level: count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3,
      });
    }

    // Calculate current streak (consecutive days with at least 1 post, going backwards from today)
    let currentStreak = 0;
    for (let i = 0; i < 365; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateKey = formatDateKey(date);

      if (dateCountMap[dateKey] && dateCountMap[dateKey] > 0) {
        currentStreak++;
      } else {
        // If it's today and no post yet, check yesterday
        if (i === 0) continue;
        break;
      }
    }

    // Calculate longest streak
    const sortedDates = Object.keys(dateCountMap).sort();
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Weekly score: (posts published this week / 4) * 100, capped at 100
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    let postsThisWeek = 0;
    for (const post of publishedPosts) {
      const postDate = post.scheduledDate || post.updatedAt;
      if (postDate >= startOfWeek) {
        postsThisWeek++;
      }
    }
    const weeklyScore = Math.min(Math.round((postsThisWeek / 4) * 100), 100);

    // Monthly score: average of weekly scores for last 4 weeks
    const weekScores: number[] = [];
    for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - weekOffset * 7);
      weekEnd.setHours(23, 59, 59, 999);

      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      let weekPostCount = 0;
      for (const post of publishedPosts) {
        const postDate = post.scheduledDate || post.updatedAt;
        if (postDate >= weekStart && postDate <= weekEnd) {
          weekPostCount++;
        }
      }

      const score = Math.min(Math.round((weekPostCount / 4) * 100), 100);
      weekScores.push(score);
    }

    const monthlyScore = weekScores.length > 0
      ? Math.round(weekScores.reduce((sum, s) => sum + s, 0) / weekScores.length)
      : 0;

    // Badges
    const badges: Badge[] = [
      {
        id: 'streak-7',
        label: '7 dias seguidos',
        icon: 'flame',
        earned: longestStreak >= 7,
        description: 'Publique por 7 dias consecutivos',
      },
      {
        id: 'streak-30',
        label: '30 dias seguidos',
        icon: 'zap',
        earned: longestStreak >= 30,
        description: 'Publique por 30 dias consecutivos',
      },
      {
        id: 'posts-100',
        label: '100 posts',
        icon: 'trophy',
        earned: totalPublished >= 100,
        description: 'Publique 100 posts no total',
      },
      {
        id: 'consistency-80',
        label: 'Consistente',
        icon: 'target',
        earned: monthlyScore >= 80,
        description: 'Mantenha score mensal acima de 80%',
      },
      {
        id: 'posts-50',
        label: '50 posts',
        icon: 'star',
        earned: totalPublished >= 50,
        description: 'Publique 50 posts no total',
      },
    ];

    const response: ConsistencyResponse = {
      currentStreak,
      longestStreak,
      weeklyScore,
      monthlyScore,
      totalPublished,
      heatmapData,
      badges,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch consistency data:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to fetch consistency analytics' },
      { status: 500 }
    );
  }
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
