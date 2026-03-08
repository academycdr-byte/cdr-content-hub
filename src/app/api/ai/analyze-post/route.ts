import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { askClaude } from '@/lib/ai/claude';
import { aiLimiter } from '@/lib/rate-limit';
import { analyzePostSchema, parseBody } from '@/lib/validations';

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
    const parsed = parseBody(analyzePostSchema, raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const body = parsed.data;

    const prompt = `Analise este post de conteudo e de feedback:

TITULO: ${body.title}
${body.hook ? `HOOK: ${body.hook}` : ''}
${body.caption ? `CAPTION: ${body.caption}` : ''}
${body.format ? `FORMATO: ${body.format}` : ''}

Retorne EXATAMENTE neste formato JSON:
{
  "onlyIvanScore": 7,
  "analysis": "O que torna este post unico ou generico",
  "suggestion": "Sugestao concreta de melhoria para tornar mais 'so o Ivan'"
}

O onlyIvanScore vai de 1 (muito generico, qualquer pessoa poderia criar) a 10 (impossivel de ser criado por outra pessoa que nao o Ivan).

IMPORTANTE: Retorne APENAS o JSON, sem markdown, sem explicacao adicional.`;

    const response = await askClaude(prompt);

    // Parse the JSON response
    let analysis: { onlyIvanScore: number; analysis: string; suggestion: string };
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      analysis = JSON.parse(jsonMatch[0]) as { onlyIvanScore: number; analysis: string; suggestion: string };
    } catch {
      console.error('Failed to parse Claude analysis response:', response.substring(0, 200));
      return NextResponse.json(
        { error: 'Erro ao processar resposta da IA' },
        { status: 500 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to analyze post:', message);

    if (message.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY nao configurada. Adicione no ambiente.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: `Erro ao analisar post: ${message}` },
      { status: 500 }
    );
  }
}
