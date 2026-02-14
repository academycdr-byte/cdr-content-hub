// ===== Enums =====

export const PostFormat = {
  REEL: 'REEL',
  CAROUSEL: 'CAROUSEL',
  STATIC: 'STATIC',
  STORY: 'STORY',
} as const;
export type PostFormat = (typeof PostFormat)[keyof typeof PostFormat];

export const PostStatus = {
  IDEA: 'IDEA',
  SCRIPT: 'SCRIPT',
  PRODUCTION: 'PRODUCTION',
  REVIEW: 'REVIEW',
  SCHEDULED: 'SCHEDULED',
  PUBLISHED: 'PUBLISHED',
} as const;
export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

export const HookCategory = {
  QUESTION: 'QUESTION',
  STATISTIC: 'STATISTIC',
  CONTRARIAN: 'CONTRARIAN',
  STORY_HOOK: 'STORY_HOOK',
  CHALLENGE: 'CHALLENGE',
} as const;
export type HookCategory = (typeof HookCategory)[keyof typeof HookCategory];

export const BatchStatus = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;
export type BatchStatus = (typeof BatchStatus)[keyof typeof BatchStatus];

export const MetricType = {
  ROAS: 'ROAS',
  REVENUE: 'REVENUE',
  GROWTH: 'GROWTH',
  CAC: 'CAC',
  OTHER: 'OTHER',
} as const;
export type MetricType = (typeof MetricType)[keyof typeof MetricType];

// ===== Interfaces =====

export interface ContentPillar {
  id: string;
  name: string;
  slug: string;
  color: string;
  targetPercentage: number;
  description: string;
  isActive: boolean;
  order: number;
}

export interface Post {
  id: string;
  title: string;
  hook: string | null;
  body: string | null;
  caption: string | null;
  hashtags: string | null;
  format: PostFormat;
  pillarId: string;
  status: PostStatus;
  scheduledDate: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  pillar?: ContentPillar;
}

export interface Hook {
  id: string;
  text: string;
  pillarId: string | null;
  format: PostFormat | 'ALL';
  category: HookCategory;
  usageCount: number;
  isActive: boolean;
  pillar?: ContentPillar;
}

export interface ChecklistTemplate {
  id: string;
  stage: PostStatus;
  items: string[];
}

export interface ChecklistCompletion {
  id: string;
  postId: string;
  templateId: string;
  completedItems: string[];
  completedAt: string | null;
}

export interface ClientResult {
  id: string;
  clientName: string;
  clientNiche: string;
  metricType: MetricType;
  metricValue: string;
  metricUnit: string;
  period: string;
  description: string;
  testimonialText: string | null;
  createdAt: string;
  updatedAt: string;
  images?: ResultImage[];
}

export interface ResultImage {
  id: string;
  resultId: string;
  url: string;
  altText: string;
  type: 'SCREENSHOT' | 'TESTIMONIAL' | 'OTHER';
}

export interface BatchSession {
  id: string;
  title: string;
  scheduledDate: string;
  notes: string | null;
  status: BatchStatus;
  createdById: string;
  posts?: BatchSessionPost[];
}

export interface BatchSessionPost {
  id: string;
  sessionId: string;
  postId: string;
  order: number;
  recordingNotes: string | null;
  post?: Post;
}

// ===== Social Accounts =====

export interface SocialAccount {
  id: string;
  userId: string;
  platform: 'instagram' | 'tiktok';
  displayName: string;
  username: string;
  profilePictureUrl: string;
  followersCount: number;
  autoSync: boolean;
  lastSyncAt: string | null;
  isActive: boolean;
  createdAt: string;
  // Token expiry for status indicators (tokens themselves are NOT exposed)
  tokenExpiresAt: string | null;
  tiktokExpiresAt: string | null;
  // Connection status identifiers
  igUserId: string | null;
  tiktokOpenId: string | null;
}

// ===== Post Metrics =====

export interface PostMetrics {
  id: string;
  postId: string | null;
  socialAccountId: string;
  externalId: string;
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  postUrl: string;
  thumbnailUrl: string;
  caption: string | null;
  mediaType: string | null;
  publishedAt: string;
  syncedAt: string;
  socialAccount?: SocialAccount;
}

export interface AggregatedMetrics {
  totals: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    posts: number;
  };
  byPlatform: {
    platform: string;
    views: number;
    likes: number;
    posts: number;
  }[];
  byAccount: {
    accountId: string;
    username: string;
    platform: string;
    views: number;
    posts: number;
  }[];
  topPosts: PostMetrics[];
}

// ===== Commission Types =====

export interface CommissionConfig {
  id: string;
  format: string;
  cpmValue: number;
  updatedAt: string;
}

export interface Commission {
  id: string;
  userId: string;
  metricId: string;
  amount: number;
  monthReference: string;
  isPaid: boolean;
  paidAt: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string };
  metric?: PostMetrics;
}

export interface CommissionStats {
  total: number;
  paid: number;
  pending: number;
  count: number;
}

// ===== UI Types =====

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: Post[];
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ===== Format & Status Labels =====

export const FORMAT_LABELS: Record<PostFormat, string> = {
  REEL: 'Reel',
  CAROUSEL: 'Carrossel',
  STATIC: 'Post',
  STORY: 'Story',
} as const;

export const STATUS_LABELS: Record<PostStatus, string> = {
  IDEA: 'Ideia',
  SCRIPT: 'Script',
  PRODUCTION: 'Producao',
  REVIEW: 'Revisao',
  SCHEDULED: 'Agendado',
  PUBLISHED: 'Publicado',
} as const;

export const STATUS_ORDER: PostStatus[] = [
  'IDEA',
  'SCRIPT',
  'PRODUCTION',
  'REVIEW',
  'SCHEDULED',
  'PUBLISHED',
] as const;
