import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { fetchInstagramMedia, refreshLongLivedToken } from '@/lib/instagram';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { generateId } from '@/lib/utils';

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

    let accessToken = account.accessToken;

    // Auto-refresh expired or expiring tokens (< 7 days remaining)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    if (account.tokenExpiresAt && account.tokenExpiresAt < sevenDaysFromNow) {
      try {
        console.log(`[IG Sync] Token expiring/expired for @${account.username}, refreshing...`);
        const refreshed = await refreshLongLivedToken(account.accessToken);
        accessToken = refreshed.access_token;
        const newExpiresAt = new Date();
        newExpiresAt.setSeconds(newExpiresAt.getSeconds() + refreshed.expires_in);

        await prisma.socialAccount.update({
          where: { id: account.id },
          data: { accessToken, tokenExpiresAt: newExpiresAt },
        });
        console.log(`[IG Sync] Token renewed for @${account.username} - expires: ${newExpiresAt.toISOString()}`);
      } catch (refreshErr) {
        const refreshMsg = refreshErr instanceof Error ? refreshErr.message : 'Unknown';
        console.error(`[IG Sync] Token refresh failed for @${account.username}:`, refreshMsg);
        return NextResponse.json(
          { error: 'Token expirado e nao foi possivel renovar. Reconecte a conta no Instagram.' },
          { status: 401 }
        );
      }
    }

    const posts = await fetchInstagramMedia(accessToken, account.igUserId);

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
          id: generateId(),
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

    console.log(`[IG Sync] @${account.username}: ${posts.length} posts, ${metricsCount} metrics synced`);
    return NextResponse.json({ synced: posts.length, metrics: metricsCount });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao sincronizar';
    console.error('[IG Sync] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
