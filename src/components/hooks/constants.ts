import type { PostFormat, HookCategory } from '@/types';

export const FORMATS: Array<PostFormat | 'ALL'> = ['ALL', 'REEL', 'CAROUSEL', 'STATIC', 'STORY'];

export const FORMAT_FILTER_LABELS: Record<string, string> = {
  ALL: 'Todos',
  REEL: 'Reel',
  CAROUSEL: 'Carrossel',
  STATIC: 'Post',
  STORY: 'Story',
};

export const CATEGORIES: Array<HookCategory | 'ALL'> = ['ALL', 'QUESTION', 'STATISTIC', 'CONTRARIAN', 'STORY_HOOK', 'CHALLENGE', 'COMPETITOR'];

export const CATEGORY_LABELS: Record<string, string> = {
  ALL: 'Todas',
  QUESTION: 'Pergunta',
  STATISTIC: 'Estatistica',
  CONTRARIAN: 'Contrario',
  STORY_HOOK: 'Historia',
  CHALLENGE: 'Desafio',
  COMPETITOR: 'Concorrente',
};

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  QUESTION: { bg: 'var(--info-surface)', text: 'var(--info)' },
  STATISTIC: { bg: 'var(--success-surface)', text: 'var(--success)' },
  CONTRARIAN: { bg: 'var(--error-surface)', text: 'var(--error)' },
  STORY_HOOK: { bg: 'var(--pillar-education-surface)', text: 'var(--pillar-education)' },
  CHALLENGE: { bg: 'var(--warning-surface)', text: 'var(--warning)' },
  COMPETITOR: { bg: 'var(--info-surface)', text: 'var(--info)' },
};
