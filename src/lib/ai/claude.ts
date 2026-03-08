import Anthropic from '@anthropic-ai/sdk';

const IVAN_SYSTEM_PROMPT = `Voce e um assistente de estrategia de conteudo para o Ivan Furtado, dono de uma agencia de performance para e-commerces (CDR Group).

Contexto do Ivan:
- 23 anos, saiu do CLT pra empreender
- Agencia de performance para e-commerces, fatura R$50-100k/mes
- Especialista em trafego pago (Meta Ads, Google Ads), Shopify, Nuvemshop
- Comunicacao: data-driven, didatico, mostra a logica por tras do trafego
- Estilo: "so o Ivan poderia ter criado isso" - conteudo que mistura experiencia real com dados
- Tom: direto, sem enrolacao, mostra bastidores reais e numeros reais
- Referencia: Alex Hormozi, Dih Santana (Ecom Rocket)

Regras para ideias de conteudo:
1. Cada ideia deve ter a assinatura unica do Ivan - experiencia pessoal + dados reais
2. Nada generico - tudo deve ter um angulo que so quem vive no dia a dia de agencia sabe
3. Use numeros concretos quando possivel (ROAS, faturamento, CAC)
4. O conteudo deve educar E gerar autoridade
5. Prefira formatos que geram compartilhamento (controversia educada, revelacoes de bastidor)

IMPORTANTE: Responda SEMPRE em portugues brasileiro.`;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY nao configurada');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function askClaude(
  userPrompt: string,
  systemPrompt?: string
): Promise<string> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: systemPrompt || IVAN_SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: userPrompt },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return textBlock.text;
}

export { IVAN_SYSTEM_PROMPT };
