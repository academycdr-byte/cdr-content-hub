import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

interface FormatSignatureItem {
  format: string;
  totalPosts: number;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
}

export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    // Build where clause
    const where: Record<string, unknown> = {};
    if (accountId) {
      where.socialAccountId = accountId;
    }

    // Aggregate PostMetrics by mediaType (mapped from Post.format via linked posts)
    const metrics = await prisma.postMetrics.findMany({
      where,
      select: {
        views: true,
        likes: true,
        comments: true,
        shares: true,
        mediaType: true,
        post: {
          select: {
            format: true,
          },
        },
      },
    });

    // Group by format: use post.format if linked, else mediaType
    const formatMap = new Map<string, { views: number[]; likes: number[]; comments: number[]; shares: number[] }>();

    for (const m of metrics) {
      const format = m.post?.format || m.mediaType || 'UNKNOWN';
      const normalized = normalizeFormat(format);

      if (!formatMap.has(normalized)) {
        formatMap.set(normalized, { views: [], likes: [], comments: [], shares: [] });
      }

      const bucket = formatMap.get(normalized)!;
      bucket.views.push(m.views);
      bucket.likes.push(m.likes);
      bucket.comments.push(m.comments);
      bucket.shares.push(m.shares);
    }

    const signatures: FormatSignatureItem[] = [];

    for (const [format, data] of formatMap.entries()) {
      const totalPosts = data.views.length;
      if (totalPosts === 0) continue;

      signatures.push({
        format,
        totalPosts,
        avgViews: Math.round(avg(data.views)),
        avgLikes: Math.round(avg(data.likes)),
        avgComments: Math.round(avg(data.comments)),
        avgShares: Math.round(avg(data.shares)),
      });
    }

    // Sort by avgViews desc
    signatures.sort((a, b) => b.avgViews - a.avgViews);

    // Generate insight
    let insight = '';
    if (signatures.length >= 2) {
      const best = signatures[0];
      const second = signatures[1];
      const ratio = second.avgViews > 0 ? (best.avgViews / second.avgViews).toFixed(1) : 'N/A';
      insight = `${best.format} tem ${ratio}x mais views que ${second.format}`;
    } else if (signatures.length === 1) {
      insight = `${signatures[0].format} e seu unico formato com dados`;
    }

    return NextResponse.json({
      signatures,
      bestFormat: signatures[0] || null,
      insight,
    });
  } catch (error) {
    console.error('Failed to compute format signatures:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to compute format signatures' },
      { status: 500 }
    );
  }
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

function normalizeFormat(raw: string): string {
  const upper = raw.toUpperCase();
  if (upper.includes('REEL') || upper === 'VIDEO') return 'REEL';
  if (upper.includes('CAROUSEL') || upper === 'CAROUSEL_ALBUM') return 'CAROUSEL';
  if (upper.includes('STATIC') || upper === 'IMAGE') return 'STATIC';
  if (upper.includes('STORY')) return 'STORY';
  return upper;
}
