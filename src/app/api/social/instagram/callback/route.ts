import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import {
  exchangeCodeForToken,
  getLongLivedToken,
  getConnectedProfiles,
} from '@/lib/instagram';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const errorReason = searchParams.get('error_reason');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/social?error=${encodeURIComponent(errorDescription || errorReason || 'Erro no login do Facebook')}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/social?error=missing_params`);
  }

  // Validate CSRF state
  const savedNonce = request.cookies.get('oauth_state')?.value;
  let stateData: { nonce: string } | null = null;
  try {
    if (state) {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    }
  } catch {
    // Invalid state format
  }

  if (!savedNonce || !stateData || stateData.nonce !== savedNonce) {
    return NextResponse.redirect(`${appUrl}/social?error=invalid_state`);
  }

  // Get authenticated user
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }
  const userId = (session.user as Record<string, unknown>).id as string;

  try {
    // 1. Exchange code for short-lived token
    const shortToken = await exchangeCodeForToken(code);

    // 2. Get long-lived token (60 days)
    const longToken = await getLongLivedToken(shortToken.access_token);

    // 3. Get all connected IG Business profiles
    const profiles = await getConnectedProfiles(longToken.access_token);

    if (profiles.length === 0) {
      throw new Error(
        'Nenhuma conta do Instagram Business conectada. Verifique se sua conta e Comercial/Criador e esta conectada a uma Pagina do Facebook.'
      );
    }

    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() + (longToken.expires_in || 5184000)
    );

    // Upsert each connected profile
    for (const profile of profiles) {
      const existing = await prisma.socialAccount.findFirst({
        where: { platform: 'instagram', igUserId: profile.ig_user_id },
      });

      const accountData = {
        userId,
        platform: 'instagram' as const,
        displayName: profile.name,
        username: profile.username,
        profilePictureUrl: profile.profile_picture_url,
        followersCount: profile.followers_count,
        igUserId: profile.ig_user_id,
        accessToken: longToken.access_token,
        tokenExpiresAt: expiresAt,
        autoSync: true,
        isActive: true,
      };

      if (existing) {
        await prisma.socialAccount.update({
          where: { id: existing.id },
          data: accountData,
        });
      } else {
        await prisma.socialAccount.create({ data: accountData });
      }
    }

    const response = NextResponse.redirect(
      `${appUrl}/social?success=instagram&count=${profiles.length}`
    );
    response.cookies.delete('oauth_state');
    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('Instagram Callback Error:', err);
    const response = NextResponse.redirect(
      `${appUrl}/social?error=${encodeURIComponent(msg)}`
    );
    response.cookies.delete('oauth_state');
    return response;
  }
}
