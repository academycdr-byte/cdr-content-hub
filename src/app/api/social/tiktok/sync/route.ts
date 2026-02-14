import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { fetchTikTokVideos, refreshTikTokToken } from '@/lib/tiktok';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as Record<string, unknown>).id as string;

    const { accountId } = (await request.json()) as { accountId: string };

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId obrigatorio' },
        { status: 400 }
      );
    }

    const account = await prisma.socialAccount.findFirst({
      where: { id: accountId, userId, platform: 'tiktok' },
    });

    if (!account || !account.tiktokOpenId || !account.tiktokToken) {
      return NextResponse.json(
        { error: 'Conta nao conectada ao TikTok' },
        { status: 400 }
      );
    }

    // Auto-refresh token if expired
    let accessToken = account.tiktokToken;
    if (
      account.tiktokExpiresAt &&
      account.tiktokExpiresAt < new Date() &&
      account.tiktokRefresh
    ) {
      try {
        const refreshed = await refreshTikTokToken(account.tiktokRefresh);
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + refreshed.expires_in);
        await prisma.socialAccount.update({
          where: { id: account.id },
          data: {
            tiktokToken: refreshed.access_token,
            tiktokRefresh: refreshed.refresh_token,
            tiktokExpiresAt: expiresAt,
          },
        });
        accessToken = refreshed.access_token;
      } catch {
        return NextResponse.json(
          { error: 'Token expirado. Reconecte a conta.' },
          { status: 401 }
        );
      }
    }

    const videos = await fetchTikTokVideos(accessToken);

    // Save PostMetrics for each synced video
    let metricsCount = 0;
    for (const video of videos) {
      await prisma.postMetrics.upsert({
        where: { externalId: video.externalId },
        update: {
          views: video.views,
          likes: video.likes,
          comments: video.comments,
          shares: video.shares,
          postUrl: video.url,
          thumbnailUrl: video.thumbnailUrl,
          caption: video.title,
          syncedAt: new Date(),
        },
        create: {
          socialAccountId: account.id,
          externalId: video.externalId,
          platform: 'tiktok',
          views: video.views,
          likes: video.likes,
          comments: video.comments,
          shares: video.shares,
          postUrl: video.url,
          thumbnailUrl: video.thumbnailUrl,
          caption: video.title,
          mediaType: 'VIDEO',
          publishedAt: new Date(video.postedAt),
        },
      });
      metricsCount++;
    }

    // Update last sync timestamp
    await prisma.socialAccount.update({
      where: { id: account.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({ synced: videos.length, metrics: metricsCount });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao sincronizar';
    console.error('TikTok sync error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
