import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getTikTokOAuthUrl } from '@/lib/tiktok';

export async function GET() {
  if (!process.env.TIKTOK_CLIENT_KEY || !process.env.TIKTOK_CLIENT_SECRET) {
    return NextResponse.json(
      {
        error:
          'TikTok App nao configurado. Adicione TIKTOK_CLIENT_KEY e TIKTOK_CLIENT_SECRET.',
      },
      { status: 500 }
    );
  }

  const nonce = randomBytes(16).toString('hex');
  const statePayload = { nonce };
  const stateStr = Buffer.from(JSON.stringify(statePayload)).toString(
    'base64url'
  );

  const url = getTikTokOAuthUrl(stateStr);
  const response = NextResponse.redirect(url);

  response.cookies.set('tiktok_oauth_state', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
