import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { fetchInstagramMedia } from '@/lib/instagram';
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
      where: { id: accountId, userId, platform: 'instagram' },
    });

    if (!account || !account.igUserId || !account.accessToken) {
      return NextResponse.json(
        { error: 'Conta nao conectada ao Instagram' },
        { status: 400 }
      );
    }

    // Check token expiration
    if (account.tokenExpiresAt && account.tokenExpiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Token expirado. Reconecte a conta.' },
        { status: 401 }
      );
    }

    const posts = await fetchInstagramMedia(
      account.accessToken,
      account.igUserId
    );

    // Save PostMetrics for each synced post
    let metricsCount = 0;
    for (const post of posts) {
      await prisma.postMetrics.upsert({
        where: { externalId: post.externalId },
        update: {
          views: post.views,
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          postUrl: post.url,
          thumbnailUrl: post.thumbnailUrl,
          caption: post.title,
          syncedAt: new Date(),
        },
        create: {
          socialAccountId: account.id,
          externalId: post.externalId,
          platform: 'instagram',
          views: post.views,
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          postUrl: post.url,
          thumbnailUrl: post.thumbnailUrl,
          caption: post.title,
          mediaType: post.mediaType,
          publishedAt: new Date(post.postedAt),
        },
      });
      metricsCount++;
    }

    // Update last sync timestamp
    await prisma.socialAccount.update({
      where: { id: account.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({ synced: posts.length, metrics: metricsCount });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao sincronizar';
    console.error('Instagram sync error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
