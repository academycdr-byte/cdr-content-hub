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

// ===== Goal Types =====

export const GoalStatus = {
  ACTIVE: 'active',
  ACHIEVED: 'achieved',
  EXPIRED: 'expired',
} as const;
export type GoalStatus = (typeof GoalStatus)[keyof typeof GoalStatus];

export const GoalPeriod = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
  CUSTOM: 'custom',
} as const;
export type GoalPeriod = (typeof GoalPeriod)[keyof typeof GoalPeriod];

export const GOAL_PERIOD_LABELS: Record<GoalPeriod, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
  custom: 'Personalizado',
} as const;

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  active: 'Ativo',
  achieved: 'Atingido',
  expired: 'Expirado',
} as const;

export interface Goal {
  id: string;
  socialAccountId: string;
  metricType: string;
  targetValue: number;
  currentValue: number;
  startValue: number;
  period: GoalPeriod;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
  socialAccount?: SocialAccount;
  progress?: number;
  daysRemaining?: number;
}

export interface FollowerSnapshot {
  id: string;
  socialAccountId: string;
  followersCount: number;
  snapshotDate: string;
}

export interface GoalWithProgress extends Goal {
  progress: number;
  daysRemaining: number;
}

// ===== Calendar Entry Types =====

export const CalendarEntryType = {
  INTERNAL: 'internal',
  SOCIAL: 'social',
} as const;
export type CalendarEntryType = (typeof CalendarEntryType)[keyof typeof CalendarEntryType];

export const SocialPlatform = {
  INSTAGRAM: 'instagram',
  TIKTOK: 'tiktok',
} as const;
export type SocialPlatform = (typeof SocialPlatform)[keyof typeof SocialPlatform];

export interface CalendarEntry {
  id: string;
  type: CalendarEntryType;
  title: string;
  platform?: SocialPlatform;
  accountName?: string;
  accountId?: string;
  thumbnailUrl?: string;
  status: string;
  format?: string;
  metrics?: { views: number; likes: number; comments: number };
  date: string;
  postUrl?: string;
  pillarColor?: string;
  pillarName?: string;
}

export interface CalendarApiResponse {
  entries: Record<string, CalendarEntry[]>;
  accounts: Array<{ id: string; platform: SocialPlatform; username: string; displayName: string }>;
}

// ===== Sync Log Types =====

export type SyncTrigger = 'cron' | 'webhook' | 'manual';

export type SyncLogStatus = 'success' | 'error' | 'partial';

export interface SyncLog {
  id: string;
  accountId: string;
  platform: string;
  trigger: SyncTrigger;
  postsFound: number;
  postsSynced: number;
  status: SyncLogStatus;
  errorMessage: string | null;
  duration: number;
  createdAt: string;
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
  PRODUCTION: 'Gravacao',
  REVIEW: 'Edicao',
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
