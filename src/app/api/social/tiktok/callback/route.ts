import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { exchangeTikTokCode, getTikTokProfile } from '@/lib/tiktok';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

  if (!code) {
    const error = searchParams.get('error') || 'missing_code';
    return NextResponse.redirect(
      `${appUrl}/social?error=${encodeURIComponent(error)}`
    );
  }

  // Validate CSRF state
  const savedNonce = request.cookies.get('tiktok_oauth_state')?.value;
  let statePayload: { nonce: string } | null = null;
  try {
    if (state) {
      statePayload = JSON.parse(Buffer.from(state, 'base64url').toString());
    }
  } catch {
    // Invalid state format
  }

  if (!savedNonce || !statePayload || statePayload.nonce !== savedNonce) {
    return NextResponse.redirect(`${appUrl}/social?error=invalid_state`);
  }

  // Get authenticated user
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }
  const userId = (session.user as Record<string, unknown>).id as string;

  try {
    // Exchange code for tokens
    const tokens = await exchangeTikTokCode(code);

    // Get profile
    const profile = await getTikTokProfile(tokens.access_token);

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    const openId = tokens.open_id || profile.open_id;

    const accountData = {
      userId,
      platform: 'tiktok' as const,
      displayName: profile.display_name || profile.username || 'TikTok User',
      username: profile.username || openId,
      profilePictureUrl: profile.avatar_url,
      followersCount: profile.follower_count,
      tiktokOpenId: openId,
      tiktokToken: tokens.access_token,
      tiktokRefresh: tokens.refresh_token,
      tiktokExpiresAt: expiresAt,
      autoSync: true,
      isActive: true,
    };

    // Check if account already exists
    const existing = await prisma.socialAccount.findFirst({
      where: { platform: 'tiktok', tiktokOpenId: openId },
    });

    if (existing) {
      await prisma.socialAccount.update({
        where: { id: existing.id },
        data: accountData,
      });
    } else {
      await prisma.socialAccount.create({ data: accountData });
    }

    const response = NextResponse.redirect(
      `${appUrl}/social?success=tiktok`
    );
    response.cookies.delete('tiktok_oauth_state');
    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('TikTok Callback Error:', err);
    const response = NextResponse.redirect(
      `${appUrl}/social?error=${encodeURIComponent(msg)}`
    );
    response.cookies.delete('tiktok_oauth_state');
    return response;
  }
}
