// TikTok API v2 Integration
// Docs: https://developers.tiktok.com/doc/login-kit-web

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

export function getTikTokOAuthUrl(state: string): string {
  const redirectUri = `${APP_URL}/api/social/tiktok/callback`;
  const scopes = 'user.info.basic,user.info.profile,user.info.stats,video.list';

  return `https://www.tiktok.com/v2/auth/authorize?client_key=${TIKTOK_CLIENT_KEY}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${state}`;
}

interface TikTokTokenResponse {
  access_token: string;
  refresh_token: string;
  open_id: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

export async function exchangeTikTokCode(
  code: string
): Promise<TikTokTokenResponse> {
  const redirectUri = `${APP_URL}/api/social/tiktok/callback`;

  const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      client_secret: TIKTOK_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TikTok token exchange failed: ${err}`);
  }

  const data = (await res.json()) as TikTokTokenResponse & {
    error?: string;
    error_description?: string;
  };
  if (data.error) {
    throw new Error(`TikTok error: ${data.error_description || data.error}`);
  }
  return data;
}

export async function refreshTikTokToken(
  refreshToken: string
): Promise<TikTokTokenResponse> {
  const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      client_secret: TIKTOK_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TikTok token refresh failed: ${err}`);
  }

  const data = (await res.json()) as TikTokTokenResponse & {
    error?: string;
    error_description?: string;
  };
  if (data.error) {
    throw new Error(`TikTok refresh error: ${data.error_description || data.error}`);
  }
  return data;
}

interface TikTokProfile {
  open_id: string;
  display_name: string;
  username: string;
  avatar_url: string;
  follower_count: number;
}

export async function getTikTokProfile(
  accessToken: string
): Promise<TikTokProfile> {
  const fields = 'open_id,display_name,username,avatar_url,follower_count';
  const res = await fetch(
    `https://open.tiktokapis.com/v2/user/info/?fields=${fields}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TikTok profile fetch failed: ${err}`);
  }

  interface TikTokUserResponse {
    error?: { code?: string; message?: string };
    data?: {
      user?: {
        open_id?: string;
        display_name?: string;
        username?: string;
        avatar_url?: string;
        follower_count?: number;
      };
    };
  }

  const data = (await res.json()) as TikTokUserResponse;
  if (data.error?.code !== 'ok' && data.error?.code) {
    throw new Error(`TikTok error: ${data.error.message}`);
  }

  const user = data.data?.user || {};
  return {
    open_id: user.open_id || '',
    display_name: user.display_name || user.username || '',
    username: user.username || '',
    avatar_url: user.avatar_url || '',
    follower_count: user.follower_count || 0,
  };
}

export interface TikTokVideo {
  externalId: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  postedAt: string;
}

export async function fetchTikTokVideos(
  accessToken: string
): Promise<TikTokVideo[]> {
  const fields =
    'id,title,video_description,share_url,cover_image_url,create_time,like_count,comment_count,share_count,view_count,duration';

  const res = await fetch(
    `https://open.tiktokapis.com/v2/video/list/?fields=${fields}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ max_count: 20 }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TikTok video fetch failed: ${err}`);
  }

  interface TikTokVideoResponse {
    error?: { code?: string; message?: string };
    data?: {
      videos?: Array<{
        id?: string;
        title?: string;
        video_description?: string;
        share_url?: string;
        cover_image_url?: string;
        create_time?: number;
        like_count?: number;
        comment_count?: number;
        share_count?: number;
        view_count?: number;
      }>;
    };
  }

  const data = (await res.json()) as TikTokVideoResponse;
  if (data.error?.code !== 'ok' && data.error?.code) {
    throw new Error(`TikTok error: ${data.error.message}`);
  }

  const videos = data.data?.videos || [];
  return videos.map((v) => ({
    externalId: `tiktok_${v.id}`,
    title:
      (v.title || v.video_description || '').slice(0, 200) || 'TikTok Video',
    url: v.share_url || '',
    thumbnailUrl: v.cover_image_url || '',
    views: v.view_count || 0,
    likes: v.like_count || 0,
    comments: v.comment_count || 0,
    shares: v.share_count || 0,
    postedAt: new Date((v.create_time || 0) * 1000).toISOString(),
  }));
}
