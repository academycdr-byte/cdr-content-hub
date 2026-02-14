import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getOAuthUrl } from '@/lib/instagram';

export async function GET() {
  if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
    return NextResponse.json(
      {
        error:
          'Meta App nao configurado. Adicione META_APP_ID e META_APP_SECRET nas variaveis de ambiente.',
      },
      { status: 500 }
    );
  }

  const nonce = randomBytes(16).toString('hex');
  const stateData = JSON.stringify({ nonce });
  const stateEncoded = Buffer.from(stateData).toString('base64url');

  const url = getOAuthUrl(stateEncoded);
  const response = NextResponse.redirect(url);

  response.cookies.set('oauth_state', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
