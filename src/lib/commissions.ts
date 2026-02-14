import { prisma } from '@/lib/prisma';
import { generateId } from '@/lib/utils';

const DEFAULT_CONFIGS = [
  { format: 'REEL', cpmValue: 2.0 },
  { format: 'CAROUSEL', cpmValue: 3.0 },
  { format: 'STATIC', cpmValue: 2.5 },
  { format: 'STORY', cpmValue: 1.5 },
] as const;

/**
 * Ensure default CPM configs exist in database.
 * Uses upsert to guarantee all 4 formats exist,
 * without overwriting user-customized values.
 */
export async function ensureDefaultConfigs() {
  const existing = await prisma.commissionConfig.findMany({
    select: { format: true },
  });
  const existingFormats = new Set(existing.map((c) => c.format));

  const missing = DEFAULT_CONFIGS.filter((c) => !existingFormats.has(c.format));

  if (missing.length > 0) {
    await prisma.commissionConfig.createMany({
      data: missing.map((c) => ({
        id: generateId(),
        format: c.format,
        cpmValue: c.cpmValue,
      })),
      skipDuplicates: true,
    });
  }
}

/**
 * Map Instagram/TikTok media types to our PostFormat.
 */
export function mapMediaTypeToFormat(mediaType: string | null): string {
  if (!mediaType) return 'STATIC';
  const type = mediaType.toUpperCase();
  if (type.includes('VIDEO') || type.includes('REEL')) return 'REEL';
  if (type.includes('CAROUSEL') || type.includes('CAROUSEL_ALBUM')) return 'CAROUSEL';
  if (type.includes('STORY')) return 'STORY';
  return 'STATIC';
}

/**
 * Calculate commissions for a given month (YYYY-MM format).
 * Deletes existing commissions for that month and recalculates.
 * Formula: (views / 1000) * cpmValue
 */
export async function calculateCommissions(
  month: string
): Promise<{ created: number; total: number }> {
  // 1. Ensure configs exist
  await ensureDefaultConfigs();

  // 2. Fetch CPM configs
  const configs = await prisma.commissionConfig.findMany();
  const cpmMap: Record<string, number> = {};
  for (const c of configs) {
    cpmMap[c.format] = c.cpmValue;
  }

  // 3. Parse month to date range
  const [year, mon] = month.split('-').map(Number);
  const startDate = new Date(year, mon - 1, 1);
  const endDate = new Date(year, mon, 1);

  // 4. Get all PostMetrics in this month range
  const metrics = await prisma.postMetrics.findMany({
    where: {
      publishedAt: { gte: startDate, lt: endDate },
    },
    include: {
      socialAccount: true,
      post: true,
    },
  });

  // 5 & 6. Delete + recreate in transaction to prevent race condition
  let created = 0;
  let total = 0;

  const commissionData: Array<{
    id: string;
    userId: string;
    metricId: string;
    amount: number;
    monthReference: string;
    isPaid: boolean;
  }> = [];

  for (const metric of metrics) {
    const format = metric.post?.format || mapMediaTypeToFormat(metric.mediaType);
    const cpmValue = cpmMap[format] || cpmMap['STATIC'] || 2.5;
    const amount = (metric.views / 1000) * cpmValue;
    if (amount <= 0) continue;

    const userId = metric.post?.assignedTo || metric.socialAccount.userId;

    commissionData.push({
      id: generateId(),
      userId,
      metricId: metric.id,
      amount: Math.round(amount * 100) / 100,
      monthReference: month,
      isPaid: false,
    });

    created++;
    total += amount;
  }

  await prisma.$transaction([
    prisma.commission.deleteMany({
      where: { monthReference: month },
    }),
    prisma.commission.createMany({
      data: commissionData,
    }),
  ]);

  return { created, total: Math.round(total * 100) / 100 };
}
