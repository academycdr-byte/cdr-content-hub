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
  QUESTION: { bg: 'rgba(48, 176, 199, 0.12)', text: '#30B0C7' },
  STATISTIC: { bg: 'rgba(52, 199, 89, 0.12)', text: '#34C759' },
  CONTRARIAN: { bg: 'rgba(255, 69, 58, 0.12)', text: '#FF453A' },
  STORY_HOOK: { bg: 'rgba(191, 90, 242, 0.12)', text: '#BF5AF2' },
  CHALLENGE: { bg: 'rgba(255, 159, 10, 0.12)', text: '#FF9F0A' },
  COMPETITOR: { bg: 'rgba(100, 210, 255, 0.12)', text: '#64D2FF' },
};
