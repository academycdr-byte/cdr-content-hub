import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { askClaude } from '@/lib/ai/claude';
import { aiLimiter } from '@/lib/rate-limit';
import { generateIdeasSchema, parseBody } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    // Rate limiting
    const limitResult = aiLimiter.check(auth.session.user.id || 'anonymous');
    if (!limitResult.success) {
      return NextResponse.json(
        { error: 'Muitas requisicoes. Tente novamente em 1 minuto.' },
        { status: 429 }
      );
    }

    const raw = await request.json();
    const parsed = parseBody(generateIdeasSchema, raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const body = parsed.data;

    // Fetch pillar info
    let pillarName = 'todos os pilares';
    if (body.pillarId) {
      const pillar = await prisma.contentPillar.findUnique({
        where: { id: body.pillarId },
      });
      if (pillar) pillarName = pillar.name;
    }

    // Get top performing posts
    const topPosts = await prisma.postMetrics.findMany({
      orderBy: [{ shares: 'desc' }, { comments: 'desc' }],
      take: 10,
      include: {
        post: {
          select: {
            title: true,
            format: true,
            hook: true,
            pillarId: true,
            contentPillar: { select: { name: true } },
          },
        },
      },
    });

    // Get active hooks
    const hooks = await prisma.hook.findMany({
      where: {
        isActive: true,
        ...(body.pillarId ? {
          OR: [
            { pillarId: body.pillarId },
            { pillarId: null },
          ],
        } : {}),
      },
      orderBy: { performanceScore: 'desc' },
      take: 10,
    });

    // Build context for Claude
    const postsContext = topPosts
      .filter((m) => m.post)
      .map((m) => `- "${m.post!.title}" (${m.post!.format}, pilar: ${m.post!.contentPillar?.name || 'N/A'}) - ${m.views} views, ${m.likes} likes, ${m.comments} comments, ${m.shares} shares`)
      .join('\n');

    const hooksContext = hooks
      .map((h) => `- "${h.text}" (score: ${h.performanceScore}, usado ${h.usageCount}x)`)
      .join('\n');

    const prompt = `Baseado nos posts que mais performaram e nos hooks ativos, sugira 5 ideias de conteudo que so o Ivan Furtado poderia criar.

PILAR FOCO: ${pillarName}

${body.includeMetrics && postsContext ? `POSTS COM MELHOR PERFORMANCE:
${postsContext}` : ''}

${hooksContext ? `HOOKS ATIVOS:
${hooksContext}` : ''}

Para cada ideia, retorne EXATAMENTE neste formato JSON (array de 5 objetos):
[
  {
    "title": "titulo do post",
    "hook": "frase de gancho de abertura",
    "angle": "angulo unico do conteudo",
    "justification": "por que essa ideia vai performar baseado nos dados"
  }
]

IMPORTANTE: Retorne APENAS o array JSON, sem markdown, sem explicacao adicional.`;

    const response = await askClaude(prompt);

    // Parse the JSON response
    let ideas: Array<{ title: string; hook: string; angle: string; justification: string }>;
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      ideas = JSON.parse(jsonMatch[0]) as Array<{ title: string; hook: string; angle: string; justification: string }>;
    } catch {
      console.error('Failed to parse Claude response as JSON:', response.substring(0, 200));
      return NextResponse.json(
        { error: 'Erro ao processar resposta da IA' },
        { status: 500 }
      );
    }

    return NextResponse.json(ideas);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to generate AI ideas:', message);

    if (message.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY nao configurada. Adicione no ambiente.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: `Erro ao gerar ideias: ${message}` },
      { status: 500 }
    );
  }
}
