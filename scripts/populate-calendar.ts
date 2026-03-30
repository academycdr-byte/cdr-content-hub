#!/usr/bin/env npx tsx
/**
 * populate-calendar.ts — Popula o calendário do Content Hub a partir de JSON planejado
 *
 * Uso:
 *   npx tsx scripts/populate-calendar.ts --input <json-path> [--dry-run] [--clear-month]
 *
 * Exemplo:
 *   npx tsx scripts/populate-calendar.ts --input /path/to/calendario-2026-04.json
 *   npx tsx scripts/populate-calendar.ts --input /path/to/calendario-2026-04.json --dry-run
 *   npx tsx scripts/populate-calendar.ts --input /path/to/calendario-2026-04.json --clear-month
 *
 * Input JSON format:
 * {
 *   "month": "2026-04",
 *   "profile": "ivanfurtado.cdr",
 *   "posts": [
 *     {
 *       "title": "...",
 *       "hook": "...",
 *       "caption": "...",
 *       "format": "REEL|CAROUSEL|STATIC|STORY",
 *       "pillar": "case-studies|educacao-tatica|bastidores|autoridade|pessoal",
 *       "scheduledDate": "2026-04-01",
 *       "status": "IDEA|SCRIPT",
 *       "purpose": "...",
 *       "audience": "...",
 *       "onlyIvan": true,
 *       "script": "...",
 *       "scriptMethod": "brendan-kane|paulo-cuenca|leandro-ladeira|custom",
 *       "ctaKeyword": "DIAGNÓSTICO",
 *       "seriesSlug": "cdr-zero-1m",
 *       "seriesEpisode": 1,
 *       "productionNotes": "..."
 *     }
 *   ]
 * }
 *
 * Squad Conteudo integration — chamado pelo workflow content-hub-mensal
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const prisma = new PrismaClient();

// ============================================================
// TYPES
// ============================================================

interface PlannedPost {
  title: string;
  hook?: string;
  caption?: string;
  format: 'REEL' | 'CAROUSEL' | 'STATIC' | 'STORY';
  pillar: string; // slug: case-studies, educacao-tatica, bastidores, autoridade, pessoal
  scheduledDate: string; // YYYY-MM-DD
  status?: string; // default: IDEA
  purpose?: string;
  audience?: string;
  onlyIvan?: boolean;
  script?: string;
  scriptMethod?: string;
  ctaKeyword?: string;
  seriesSlug?: string;
  seriesEpisode?: number;
  productionNotes?: string;
  hashtags?: string;
}

interface CalendarInput {
  month: string; // YYYY-MM
  profile: string; // handle without @
  posts: PlannedPost[];
}

interface PopulateResult {
  success: boolean;
  totalPlanned: number;
  created: number;
  errors: number;
  posts: Array<{
    title: string;
    id?: string;
    status: 'created' | 'error';
    error?: string;
  }>;
}

// ============================================================
// HELPERS
// ============================================================

async function loadPillarMap(): Promise<Map<string, string>> {
  const pillars = await prisma.contentPillar.findMany();
  const map = new Map<string, string>();
  for (const p of pillars) {
    map.set(p.slug, p.id);
    map.set(p.name.toLowerCase(), p.id);
  }
  return map;
}

async function loadSeriesMap(): Promise<Map<string, string>> {
  const series = await prisma.contentSeries.findMany();
  const map = new Map<string, string>();
  for (const s of series) {
    map.set(s.slug, s.id);
    map.set(s.name.toLowerCase(), s.id);
  }
  return map;
}

async function loadSocialAccountMap(): Promise<Map<string, string>> {
  const accounts = await prisma.socialAccount.findMany();
  const map = new Map<string, string>();
  for (const a of accounts) {
    map.set(a.username.toLowerCase(), a.id);
    if (a.username.includes('.')) {
      map.set(a.username.replace('.', '').toLowerCase(), a.id);
    }
  }
  return map;
}

async function getDefaultUserId(): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: { email: 'ivan@cdrgroup.com.br' },
  });
  return user?.id ?? null;
}

// ============================================================
// MAIN
// ============================================================

async function populateCalendar(
  input: CalendarInput,
  options: { dryRun: boolean; clearMonth: boolean }
): Promise<PopulateResult> {
  const result: PopulateResult = {
    success: true,
    totalPlanned: input.posts.length,
    created: 0,
    errors: 0,
    posts: [],
  };

  // Load lookup maps
  const pillarMap = await loadPillarMap();
  const seriesMap = await loadSeriesMap();
  const accountMap = await loadSocialAccountMap();
  const userId = await getDefaultUserId();

  // Resolve social account
  const socialAccountId = accountMap.get(input.profile.toLowerCase()) ?? null;

  console.log(`\n📅 Populando calendário: ${input.month}`);
  console.log(`👤 Perfil: @${input.profile}`);
  console.log(`📊 Posts planejados: ${input.posts.length}`);
  console.log(`🔗 Social Account: ${socialAccountId ? 'encontrado' : 'não encontrado (posts sem vínculo)'}`);
  if (options.dryRun) console.log(`⚠️  DRY RUN — nenhum post será criado`);
  console.log('');

  // Clear existing posts for the month if requested
  if (options.clearMonth && !options.dryRun) {
    const [year, month] = input.month.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const deleted = await prisma.post.deleteMany({
      where: {
        scheduledDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['IDEA', 'SCRIPT'] }, // Only delete draft posts
        ...(socialAccountId ? { socialAccountId } : {}),
      },
    });
    console.log(`🗑️  Removidos ${deleted.count} posts rascunho do mês ${input.month}\n`);
  }

  // Create posts
  for (let i = 0; i < input.posts.length; i++) {
    const planned = input.posts[i];
    const num = `[${i + 1}/${input.posts.length}]`;

    // Resolve pillar
    const pillarId = pillarMap.get(planned.pillar.toLowerCase())
      ?? pillarMap.get(planned.pillar);

    if (!pillarId) {
      console.log(`❌ ${num} "${planned.title}" — pilar "${planned.pillar}" não encontrado`);
      result.errors++;
      result.posts.push({
        title: planned.title,
        status: 'error',
        error: `Pilar "${planned.pillar}" não encontrado. Disponíveis: ${Array.from(pillarMap.keys()).filter(k => !k.includes(' ')).join(', ')}`,
      });
      continue;
    }

    // Resolve series
    let seriesId: string | null = null;
    if (planned.seriesSlug) {
      seriesId = seriesMap.get(planned.seriesSlug.toLowerCase()) ?? null;
      if (!seriesId) {
        console.log(`⚠️  ${num} Série "${planned.seriesSlug}" não encontrada — post criado sem série`);
      }
    }

    if (options.dryRun) {
      console.log(`✅ ${num} [DRY] "${planned.title}" — ${planned.format} | ${planned.pillar} | ${planned.scheduledDate}`);
      result.created++;
      result.posts.push({ title: planned.title, status: 'created', id: 'dry-run' });
      continue;
    }

    try {
      const post = await prisma.post.create({
        data: {
          id: crypto.randomUUID(),
          title: planned.title,
          hook: planned.hook ?? null,
          caption: planned.caption ?? null,
          hashtags: planned.hashtags ?? null,
          format: planned.format,
          pillarId,
          status: (planned.status as 'IDEA' | 'SCRIPT') ?? 'IDEA',
          scheduledDate: new Date(planned.scheduledDate + 'T12:00:00Z'),
          purpose: planned.purpose ?? null,
          audience: planned.audience ?? null,
          onlyIvan: planned.onlyIvan ?? true,
          socialAccountId,
          script: planned.script ?? null,
          scriptMethod: planned.scriptMethod ?? null,
          ctaKeyword: planned.ctaKeyword ?? null,
          seriesId,
          seriesEpisode: planned.seriesEpisode ?? null,
          productionNotes: planned.productionNotes ?? null,
          createdById: userId,
        },
      });

      console.log(`✅ ${num} "${planned.title}" — ${planned.format} | ${planned.pillar} | ${planned.scheduledDate} [${post.id}]`);
      result.created++;
      result.posts.push({ title: planned.title, status: 'created', id: post.id });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`❌ ${num} "${planned.title}" — ERRO: ${msg}`);
      result.errors++;
      result.posts.push({ title: planned.title, status: 'error', error: msg });
    }
  }

  result.success = result.errors === 0;

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log(`  📅 Calendário ${input.month} — @${input.profile}`);
  console.log('═'.repeat(50));
  console.log(`  Planejados: ${result.totalPlanned}`);
  console.log(`  Criados:    ${result.created}`);
  console.log(`  Erros:      ${result.errors}`);
  console.log(`  Status:     ${result.success ? '✅ SUCESSO' : '⚠️ COM ERROS'}`);
  console.log('═'.repeat(50));

  return result;
}

// ============================================================
// CLI
// ============================================================

async function main() {
  const args = process.argv.slice(2);

  const inputIndex = args.indexOf('--input');
  if (inputIndex === -1 || !args[inputIndex + 1]) {
    console.error('❌ Uso: npx tsx scripts/populate-calendar.ts --input <json-path> [--dry-run] [--clear-month]');
    process.exit(1);
  }

  const inputPath = resolve(args[inputIndex + 1]);
  const dryRun = args.includes('--dry-run');
  const clearMonth = args.includes('--clear-month');

  if (!existsSync(inputPath)) {
    console.error(`❌ Arquivo não encontrado: ${inputPath}`);
    process.exit(1);
  }

  const raw = readFileSync(inputPath, 'utf-8');
  let input: CalendarInput;

  try {
    input = JSON.parse(raw) as CalendarInput;
  } catch {
    console.error('❌ JSON inválido no arquivo de input');
    process.exit(1);
  }

  if (!input.month || !input.posts || !Array.isArray(input.posts)) {
    console.error('❌ JSON deve ter { month: "YYYY-MM", profile: "handle", posts: [...] }');
    process.exit(1);
  }

  const result = await populateCalendar(input, { dryRun, clearMonth });

  // Output result as JSON for pipeline consumption
  const resultPath = inputPath.replace('.json', '-result.json');
  const { writeFileSync } = await import('fs');
  writeFileSync(resultPath, JSON.stringify(result, null, 2));
  console.log(`\n📄 Resultado salvo em: ${resultPath}`);

  process.exit(result.success ? 0 : 1);
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
