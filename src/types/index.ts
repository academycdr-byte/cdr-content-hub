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
  COMPETITOR: 'COMPETITOR',
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
  socialAccountId: string | null;
  socialAccount?: SocialAccount;
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
  purpose: string | null;
  audience: string | null;
  onlyIvan: boolean;
  socialAccountId: string | null;
  // Novos campos
  script: string | null;
  scriptMethod: string | null;
  ctaKeyword: string | null;
  seriesId: string | null;
  seriesEpisode: number | null;
  crossPostId: string | null;
  productionNotes: string | null;
  createdAt: string;
  updatedAt: string;
  pillar?: ContentPillar;
  socialAccount?: SocialAccount;
  series?: ContentSeries;
  crossPost?: Post;
}

export interface Hook {
  id: string;
  text: string;
  scenes: string | null;
  conclusion: string | null;
  pillarId: string | null;
  format: PostFormat | 'ALL';
  category: HookCategory;
  usageCount: number;
  isActive: boolean;
  avgSaves: number;
  avgShares: number;
  performanceScore: number;
  lastUsedAt: string | null;
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
  saves: number;
  reach: number;
  impressions: number;
  profileVisits: number;
  follows: number;
  engagementRate: number | null;
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

// ===== Content Series =====

export interface ContentSeries {
  id: string;
  name: string;
  slug: string;
  description: string;
  socialAccountId: string;
  frequency: string;
  totalEpisodes: number | null;
  currentEpisode: number;
  color: string;
  icon: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  socialAccount?: SocialAccount;
  posts?: Post[];
}

// ===== DM Keywords =====

export interface DmKeyword {
  id: string;
  keyword: string;
  description: string;
  socialAccountId: string;
  totalReceived: number;
  lastReceivedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  socialAccount?: SocialAccount;
}

// ===== Notifications =====

export const NotificationPriority = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;
export type NotificationPriority = (typeof NotificationPriority)[keyof typeof NotificationPriority];

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

// ===== Goal Metric Types =====

export const GOAL_METRIC_TYPES = {
  followers: 'Seguidores',
  engagement_rate: 'Taxa de Engajamento',
  avg_views: 'Views Medio por Post',
  avg_saves: 'Saves Medio por Post',
  dm_leads: 'Leads por DM/mes',
  posts_per_week: 'Posts por Semana',
  consistency_score: 'Score de Consistencia',
} as const;
export type GoalMetricType = keyof typeof GOAL_METRIC_TYPES;

export const GOAL_METRIC_UNITS: Record<GoalMetricType, string> = {
  followers: '',
  engagement_rate: '%',
  avg_views: '',
  avg_saves: '',
  dm_leads: '',
  posts_per_week: 'posts/sem',
  consistency_score: '%',
};

export const SCRIPT_METHODS = {
  'brendan-kane': 'Brendan Kane (Hook Mastery)',
  'paulo-cuenca': 'Paulo Cuenca (Narrativa)',
  'leandro-ladeira': 'Leandro Ladeira (Copy Direta)',
  'custom': 'Custom',
} as const;

export const SERIES_FREQUENCIES = {
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
  variable: 'Variavel',
} as const;

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

// ===== Dashboard Types =====

export interface PipelineStatusItem {
  status: string;
  count: number;
  color: string;
}

export interface PillarMixItem {
  id: string;
  name: string;
  slug: string;
  color: string;
  targetPercentage: number;
  count: number;
  percentage: number;
}

export interface UpcomingPostItem {
  id: string;
  title: string;
  scheduledDate: string;
  pillarName: string;
  pillarColor: string;
  format: string;
}

export interface MetricsSummary {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  posts: number;
}

export interface PlatformBreakdown {
  platform: string;
  label: string;
  postsCount: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  cpmValue: number;
}

export interface ProfileBreakdown {
  accountId: string;
  displayName: string;
  username: string;
  platform: string;
  postsCount: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  cpmValue: number;
}

export interface TopPostItem {
  id: string;
  caption: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
  platform: string;
  thumbnailUrl: string;
  postUrl: string;
  publishedAt: string;
  mediaType: string;
  accountName: string;
}

export interface GoalProgressItem {
  metricType: string;
  accountName: string;
  accountId: string;
  target: number;
  current: number;
  progress: number;
  onTrack: boolean;
}

export interface ContentMixComparisonItem {
  name: string;
  targetPct: number;
  actualPct: number;
  deviation: number;
  status: 'ok' | 'warning' | 'critical';
}

export interface PostingPace {
  targetPerWeek: number;
  actualThisWeek: number;
  status: 'ahead' | 'on_track' | 'behind';
  weeklyTrend: number[];
}

export interface SeriesStatusItem {
  id: string;
  name: string;
  lastEpisode: number;
  lastPublished: string | null;
  nextDue: string | null;
  status: 'on_track' | 'overdue' | 'paused';
  color: string;
}

export interface DashboardStats {
  postsThisMonth: number;
  monthlyGoal: number;
  consistencyScore: number;
  pipeline: PipelineStatusItem[];
  contentMix: PillarMixItem[];
  upcomingPosts: UpcomingPostItem[];
  resultsWithoutPost: number;
  metricsSummary: MetricsSummary | null;
  dateRange: { startDate: string; endDate: string; label: string };
  totalCpmValue: number;
  platformBreakdown: PlatformBreakdown[];
  profileBreakdown: ProfileBreakdown[];
  topPosts: TopPostItem[];
  // Novos campos
  goalsProgress: GoalProgressItem[];
  contentMixComparison: ContentMixComparisonItem[];
  postingPace: PostingPace;
  seriesStatus: SeriesStatusItem[];
}
