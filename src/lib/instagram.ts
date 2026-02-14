// Facebook Login for Instagram Business (v22.0)
// Docs: https://developers.facebook.com/docs/instagram/business-login-for-instagram
// Note: Meta deprecated 'impressions' and 'plays' on April 21, 2025.
//       Use 'views' metric instead (available from v22.0+).

const FB_API = 'https://graph.facebook.com';
const API_VERSION = 'v22.0';
const META_APP_ID = process.env.META_APP_ID!;
const META_APP_SECRET = process.env.META_APP_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

export function getOAuthUrl(state: string): string {
  const redirectUri = `${APP_URL}/api/social/instagram/callback`;
  const scopes = [
    'instagram_basic',
    'instagram_manage_insights',
    'pages_show_list',
    'business_management',
  ].join(',');

  return `https://www.facebook.com/${API_VERSION}/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${state}`;
}

export async function exchangeCodeForToken(
  code: string
): Promise<{ access_token: string; expires_in: number }> {
  const redirectUri = `${APP_URL}/api/social/instagram/callback`;
  const tokenUrl = `${FB_API}/${API_VERSION}/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${META_APP_SECRET}&code=${code}`;

  const res = await fetch(tokenUrl);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to exchange code: ${err}`);
  }
  return res.json();
}

export async function getLongLivedToken(
  shortToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const url = `${FB_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortToken}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to get long-lived token: ${err}`);
  }
  return res.json();
}

export async function refreshLongLivedToken(
  token: string
): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch(
    `${FB_API}/${API_VERSION}/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${encodeURIComponent(token)}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to refresh Instagram token: ${(error as Record<string, Record<string, string>>)?.error?.message || response.statusText}`
    );
  }

  const data = (await response.json()) as { access_token: string; expires_in?: number };
  return {
    access_token: data.access_token,
    expires_in: data.expires_in || 5184000,
  };
}

interface ConnectedProfile {
  igUserId: string;
  name: string;
  username: string;
  profilePictureUrl: string;
  followersCount: number;
}

export async function getConnectedProfiles(
  accessToken: string
): Promise<ConnectedProfile[]> {
  const fields =
    'name,instagram_business_account{id,username,profile_picture_url,followers_count}';
  const pagesUrl = `${FB_API}/${API_VERSION}/me/accounts?fields=${fields}&limit=100&access_token=${accessToken}`;

  const res = await fetch(pagesUrl);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch pages: ${err}`);
  }

  interface PageData {
    name: string;
    instagram_business_account?: {
      id: string;
      username: string;
      profile_picture_url?: string;
      followers_count?: number;
    };
  }

  const data = (await res.json()) as { data?: PageData[] };

  if (!data.data || !Array.isArray(data.data)) {
    return [];
  }

  return data.data
    .filter((p) => p.instagram_business_account)
    .map((p) => {
      const igAccount = p.instagram_business_account!;
      return {
        igUserId: igAccount.id,
        name: p.name,
        username: igAccount.username,
        profilePictureUrl: igAccount.profile_picture_url || '',
        followersCount: igAccount.followers_count || 0,
      };
    });
}

interface IGMedia {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
}

interface IGInsights {
  views?: number;
  reach?: number;
  shares?: number;
  saves?: number;
}

export interface SyncedPost {
  externalId: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  mediaType: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  postedAt: string;
}

export async function fetchInstagramMedia(
  accessToken: string,
  igUserId: string
): Promise<SyncedPost[]> {
  const mediaFields =
    'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count';
  const url = `${FB_API}/${API_VERSION}/${igUserId}/media?fields=${mediaFields}&limit=50&access_token=${accessToken}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch media: ${err}`);
  }
  const data = (await res.json()) as { data?: IGMedia[] };

  if (!data.data) return [];

  const posts: SyncedPost[] = [];

  for (const media of data.data) {
    const insights: IGInsights = {};

    // Since April 2025, Meta unified 'impressions' and 'plays' into 'views'.
    // Try: views, reach, shares, saves (works for all media types in v22.0+)
    const metricsToTry: string[][] = [
      ['views', 'reach', 'shares', 'saves'],
      ['views', 'reach', 'shares'],
      ['views', 'reach'],
      ['views'],
      ['reach'],
    ];

    let gotInsights = false;
    for (const metrics of metricsToTry) {
      if (gotInsights) break;
      try {
        const insightsRes = await fetch(
          `${FB_API}/${API_VERSION}/${media.id}/insights?metric=${metrics.join(',')}&access_token=${accessToken}`
        );
        if (insightsRes.ok) {
          const insightsData = (await insightsRes.json()) as {
            data?: Array<{ name: string; values?: Array<{ value?: number }> }>;
          };
          if (insightsData.data && insightsData.data.length > 0) {
            for (const metric of insightsData.data) {
              const val = metric.values?.[0]?.value || 0;
              if (metric.name === 'views') {
                insights.views = val;
              } else if (metric.name === 'reach') {
                insights.reach = val;
              } else if (metric.name === 'shares') {
                insights.shares = val;
              } else if (metric.name === 'saves') {
                insights.saves = val;
              }
            }
            gotInsights = true;
          }
        } else {
          const errText = await insightsRes.text();
          console.log(`[IG Sync] Insights [${metrics.join(',')}] for ${media.id} (${media.media_type}): ${insightsRes.status} - ${errText.slice(0, 200)}`);
        }
      } catch (err) {
        console.log(`[IG Sync] Insights error for ${media.id}: ${err instanceof Error ? err.message : 'unknown'}`);
      }
    }

    const views = insights.views || insights.reach || 0;

    posts.push({
      externalId: media.id,
      title: (media.caption || '').slice(0, 200) || `Post ${media.media_type}`,
      url: media.permalink || '',
      thumbnailUrl: media.thumbnail_url || media.media_url || '',
      mediaType: media.media_type,
      views,
      likes: media.like_count || 0,
      comments: media.comments_count || 0,
      shares: insights.shares || 0,
      postedAt: media.timestamp.split('T')[0],
    });
  }

  return posts;
}
