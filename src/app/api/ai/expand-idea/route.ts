import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { askClaude } from '@/lib/ai/claude';
import { aiLimiter } from '@/lib/rate-limit';
import { expandIdeaSchema, parseBody } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    // Rate limiting
    const limitResult = aiLimiter.check(auth.session.user.id || 'anonymous');
    if (!limitResult.success) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
        { status: 429 }
      );
    }

    const raw = await request.json();
    const parsed = parseBody(expandIdeaSchema, raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const body = parsed.data;

    const prompt = `O Ivan teve a seguinte ideia de conteúdo:

"${body.text.trim()}"

Expanda essa ideia em um plano de execução prático e detalhado. Retorne EXATAMENTE neste formato JSON:

{
  "summary": "resumo da ideia em 1 frase clara",
  "format": "REEL ou CAROUSEL ou STORY_SEQUENCE ou POST",
  "estimatedParts": 3,
  "steps": [
    {
      "part": 1,
      "type": "story/slide/cena",
      "content": "o que mostrar/falar nessa parte",
      "tip": "dica prática de execução (ângulo de câmera, texto na tela, etc)"
    }
  ],
  "hook": "frase de abertura que prende a atenção",
  "cta": "call-to-action final sugerido",
  "bestTime": "melhor horário/dia para postar esse tipo de conteúdo",
  "extraTips": ["dica extra 1", "dica extra 2"]
}

Regras:
- Pense como se fosse um diretor de conteúdo dando o roteiro pro Ivan executar
- Cada step deve ser ACIONAVEL - o Ivan precisa saber exatamente o que fazer
- Se for stories, detalhe cada story individualmente
- Se for carrossel, detalhe cada slide
- Se for reel, detalhe cada cena/momento
- Mantenha o tom do Ivan: direto, sem enrolação, dados reais quando possível
- IMPORTANTE: Retorne APENAS o JSON, sem markdown, sem explicação adicional.`;

    const response = await askClaude(prompt);

    // Parse JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const plan = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    return NextResponse.json(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to expand idea:', message);

    if (message.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY não configurada' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: `Erro ao expandir ideia: ${message}` },
      { status: 500 }
    );
  }
}
