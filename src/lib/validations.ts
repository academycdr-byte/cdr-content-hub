import { z } from 'zod';

// ─── Posts ──────────────────────────────────────────────────────
export const createPostSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(500),
  format: z.string().min(1, 'Formato é obrigatório'),
  pillarId: z.string().min(1, 'Pilar é obrigatório'),
  scheduledDate: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional()),
  hook: z.string().max(2000).optional(),
  status: z.string().optional(),
  body: z.string().max(10000).optional(),
  purpose: z.string().max(1000).nullable().optional(),
  audience: z.string().max(1000).nullable().optional(),
  onlyIvan: z.boolean().optional(),
  socialAccountId: z.string().nullable().optional(),
});

export const updatePostSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  hook: z.string().max(2000).optional(),
  body: z.string().max(10000).optional(),
  caption: z.string().max(5000).optional(),
  hashtags: z.string().max(2000).optional(),
  format: z.string().optional(),
  pillarId: z.string().optional(),
  status: z.string().optional(),
  scheduledDate: z.string().nullable().optional(),
  purpose: z.string().max(1000).nullable().optional(),
  audience: z.string().max(1000).nullable().optional(),
  onlyIvan: z.boolean().optional(),
  socialAccountId: z.string().nullable().optional(),
});

export const patchPostSchema = z.object({
  scheduledDate: z.string().optional(),
  status: z.string().optional(),
});

const VALID_STATUSES = ['IDEA', 'SCRIPT', 'PRODUCTION', 'REVIEW', 'SCHEDULED', 'PUBLISHED'] as const;
export const postStatusSchema = z.object({
  status: z.enum(VALID_STATUSES, {
    error: `Status inválido. Valores aceitos: ${VALID_STATUSES.join(', ')}`,
  }),
});

// ─── Hooks ──────────────────────────────────────────────────────
export const createHookSchema = z.object({
  text: z.string().min(1, 'Texto do gancho é obrigatório').max(2000),
  scenes: z.string().max(5000).nullable().optional(),
  conclusion: z.string().max(5000).nullable().optional(),
  pillarId: z.string().nullable().optional(),
  format: z.string().optional(),
  category: z.string().optional(),
});

export const updateHookSchema = z.object({
  text: z.string().min(1).max(2000).optional(),
  scenes: z.string().max(5000).nullable().optional(),
  conclusion: z.string().max(5000).nullable().optional(),
  pillarId: z.string().nullable().optional(),
  format: z.string().optional(),
  category: z.string().optional(),
  usageCount: z.number().int().min(0).optional(),
  incrementUsage: z.boolean().optional(),
});

export const suggestHookSchema = z.object({
  pillarId: z.string().optional(),
  format: z.string().optional(),
});

// ─── Goals ──────────────────────────────────────────────────────
export const createGoalSchema = z.object({
  socialAccountId: z.string().min(1, 'socialAccountId é obrigatório'),
  metricType: z.string().optional(),
  targetValue: z.number().int().positive('targetValue deve ser positivo'),
  period: z.string().min(1, 'period é obrigatório'),
  endDate: z.string().min(1, 'endDate é obrigatório'),
});

export const updateGoalSchema = z.object({
  targetValue: z.number().int().positive().optional(),
  period: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
});

// ─── Results ────────────────────────────────────────────────────
const resultImageSchema = z.object({
  url: z.string().url(),
  altText: z.string().max(500).optional(),
  type: z.string().optional(),
});

export const createResultSchema = z.object({
  clientName: z.string().min(1, 'clientName é obrigatório').max(200),
  clientNiche: z.string().min(1, 'clientNiche é obrigatório').max(200),
  metricType: z.string().min(1, 'metricType é obrigatório'),
  metricValue: z.string().min(1, 'metricValue é obrigatório').max(100),
  metricUnit: z.string().max(50).optional(),
  period: z.string().min(1, 'period é obrigatório').max(200),
  description: z.string().max(2000).optional(),
  testimonialText: z.string().max(5000).optional(),
  imageUrls: z.array(resultImageSchema).optional(),
});

export const updateResultSchema = z.object({
  clientName: z.string().min(1).max(200).optional(),
  clientNiche: z.string().min(1).max(200).optional(),
  metricType: z.string().optional(),
  metricValue: z.string().max(100).optional(),
  metricUnit: z.string().max(50).optional(),
  period: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  testimonialText: z.string().max(5000).nullable().optional(),
  imageUrls: z.array(resultImageSchema).optional(),
});

// ─── Pillars ────────────────────────────────────────────────────
export const updatePillarsSchema = z.array(
  z.object({
    id: z.string().min(1),
    name: z.string().min(1).max(100),
    color: z.string().min(1).max(20),
    targetPercentage: z.number().int().min(0).max(100),
    description: z.string().max(1000),
    order: z.number().int().min(0),
  })
);

// ─── Checklists ─────────────────────────────────────────────────
export const patchChecklistSchema = z.object({
  completedItems: z.array(z.string()),
});

export const updateChecklistTemplatesSchema = z.array(
  z.object({
    id: z.string().min(1),
    stage: z.string().min(1),
    items: z.array(z.string()),
  })
);

// ─── Commissions ────────────────────────────────────────────────
export const updateCommissionSchema = z.object({
  format: z.string().min(1, 'Formato é obrigatório'),
  cpmValue: z.number().min(0, 'cpmValue deve ser >= 0'),
});

// ─── Social ─────────────────────────────────────────────────────
export const autoSyncSchema = z.object({
  accountId: z.string().min(1, 'accountId é obrigatório'),
  autoSync: z.boolean({ error: 'autoSync é obrigatório' }),
});

export const syncAccountSchema = z.object({
  accountId: z.string().min(1, 'accountId é obrigatório'),
});

// ─── AI ─────────────────────────────────────────────────────────
export const analyzePostSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(500),
  hook: z.string().max(2000).optional(),
  caption: z.string().max(5000).optional(),
  format: z.string().optional(),
});

export const generateIdeasSchema = z.object({
  pillarId: z.string().optional(),
  includeMetrics: z.boolean().optional(),
});

export const expandIdeaSchema = z.object({
  text: z.string().min(1, 'Texto da ideia é obrigatório').max(5000),
});

// ─── Ideation ───────────────────────────────────────────────────
export const createIdeaSchema = z.object({
  text: z.string().min(1, 'Texto da ideia é obrigatório').max(5000),
  pillarId: z.string().nullable().optional(),
});

// ─── Helper ─────────────────────────────────────────────────────
export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const message = result.error.issues.map((i) => i.message).join('; ');
  return { success: false, error: message };
}
