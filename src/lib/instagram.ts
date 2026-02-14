// Facebook Login for Instagram Business (v21.0)
// Docs: https://developers.facebook.com/docs/instagram/business-login-for-instagram

const FB_API = 'https://graph.facebook.com';
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

  return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${state}`;
}

export async function exchangeCodeForToken(
  code: string
): Promise<{ access_token: string; expires_in: number }> {
  const redirectUri = `${APP_URL}/api/social/instagram/callback`;
  const tokenUrl = `${FB_API}/v21.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${META_APP_SECRET}&code=${code}`;

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
    `${FB_API}/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${encodeURIComponent(token)}`
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
  ig_user_id: string;
  name: string;
  username: string;
  profile_picture_url: string;
  followers_count: number;
}

export async function getConnectedProfiles(
  accessToken: string
): Promise<ConnectedProfile[]> {
  const fields =
    'name,instagram_business_account{id,username,profile_picture_url,followers_count}';
  const pagesUrl = `${FB_API}/v21.0/me/accounts?fields=${fields}&limit=100&access_token=${accessToken}`;

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
        ig_user_id: igAccount.id,
        name: p.name,
        username: igAccount.username,
        profile_picture_url: igAccount.profile_picture_url || '',
        followers_count: igAccount.followers_count || 0,
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
  impressions?: number;
  reach?: number;
  shares?: number;
  plays?: number;
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
  const url = `${FB_API}/v21.0/${igUserId}/media?fields=${mediaFields}&limit=50&access_token=${accessToken}`;

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

    // Try multiple metric combinations based on media type
    // Reels: plays, ig_reels_aggregated_all_plays_count, reach, shares
    // Video: plays, reach, impressions
    // Image/Carousel: impressions, reach
    const isReel = media.media_type === 'REEL';
    const isVideo = media.media_type === 'VIDEO';
    const isCarousel = media.media_type === 'CAROUSEL_ALBUM';

    // Attempt 1: Get views/impressions
    const metricsToTry: string[][] = [];
    if (isReel) {
      metricsToTry.push(
        ['ig_reels_aggregated_all_plays_count', 'reach', 'shares'],
        ['plays', 'reach', 'shares'],
        ['reach'],
      );
    } else if (isVideo) {
      metricsToTry.push(
        ['plays', 'reach', 'impressions'],
        ['reach', 'impressions'],
        ['impressions'],
      );
    } else if (isCarousel) {
      metricsToTry.push(
        ['impressions', 'reach'],
        ['reach'],
      );
    } else {
      metricsToTry.push(
        ['impressions', 'reach'],
        ['reach'],
      );
    }

    let gotInsights = false;
    for (const metrics of metricsToTry) {
      if (gotInsights) break;
      try {
        const insightsRes = await fetch(
          `${FB_API}/v21.0/${media.id}/insights?metric=${metrics.join(',')}&access_token=${accessToken}`
        );
        if (insightsRes.ok) {
          const insightsData = (await insightsRes.json()) as {
            data?: Array<{ name: string; values?: Array<{ value?: number }> }>;
          };
          if (insightsData.data && insightsData.data.length > 0) {
            for (const metric of insightsData.data) {
              const val = metric.values?.[0]?.value || 0;
              if (metric.name === 'ig_reels_aggregated_all_plays_count' || metric.name === 'plays') {
                insights.plays = val;
              } else if (metric.name === 'impressions') {
                insights.impressions = val;
              } else if (metric.name === 'reach') {
                insights.reach = val;
              } else if (metric.name === 'shares') {
                insights.shares = val;
              }
            }
            gotInsights = true;
          }
        } else {
          const errText = await insightsRes.text();
          console.log(`Insights attempt [${metrics.join(',')}] for ${media.id} (${media.media_type}): ${insightsRes.status} - ${errText.slice(0, 200)}`);
        }
      } catch (err) {
        console.log(`Insights error for ${media.id}: ${err instanceof Error ? err.message : 'unknown'}`);
      }
    }

    // If no insights endpoint worked, try shares separately
    if (gotInsights && !insights.shares) {
      try {
        const shareRes = await fetch(
          `${FB_API}/v21.0/${media.id}/insights?metric=shares&access_token=${accessToken}`
        );
        if (shareRes.ok) {
          const shareData = (await shareRes.json()) as {
            data?: Array<{ values?: Array<{ value?: number }> }>;
          };
          if (shareData.data?.[0]?.values?.[0]?.value) {
            insights.shares = shareData.data[0].values[0].value;
          }
        }
      } catch {
        // Shares not available for this media type
      }
    }

    const views = insights.plays || insights.impressions || insights.reach || 0;

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
