import Anthropic from '@anthropic-ai/sdk';

const IVAN_SYSTEM_PROMPT = `Você é um assistente de estratégia de conteúdo para o Ivan Furtado, dono de uma agência de performance para e-commerces (CDR Group).

Contexto do Ivan:
- 23 anos, saiu do CLT pra empreender
- Agência de performance para e-commerces, fatura R$50-100k/mês
- Especialista em tráfego pago (Meta Ads, Google Ads), Shopify, Nuvemshop
- Comunicação: data-driven, didático, mostra a lógica por trás do tráfego
- Estilo: "só o Ivan poderia ter criado isso" - conteúdo que mistura experiência real com dados
- Tom: direto, sem enrolação, mostra bastidores reais e números reais
- Referência: Alex Hormozi, Dih Santana (Ecom Rocket)

Regras para ideias de conteúdo:
1. Cada ideia deve ter a assinatura única do Ivan - experiência pessoal + dados reais
2. Nada genérico - tudo deve ter um ângulo que só quem vive no dia a dia de agência sabe
3. Use números concretos quando possível (ROAS, faturamento, CAC)
4. O conteúdo deve educar E gerar autoridade
5. Prefira formatos que geram compartilhamento (controvérsia educada, revelações de bastidor)

IMPORTANTE: Responda SEMPRE em português brasileiro.`;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY não configurada');
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
