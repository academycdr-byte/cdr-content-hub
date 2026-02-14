import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ===== USERS =====
  const hashedPassword = await bcrypt.hash('cdr2026', 12);

  const ivan = await prisma.user.upsert({
    where: { email: 'ivan@cdrgroup.com.br' },
    update: {},
    create: {
      name: 'Ivan Furtado',
      email: 'ivan@cdrgroup.com.br',
      password: hashedPassword,
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'social@cdrgroup.com.br' },
    update: {},
    create: {
      name: 'Social Media',
      email: 'social@cdrgroup.com.br',
      password: hashedPassword,
      role: 'member',
    },
  });

  console.log('Users seeded');

  // ===== CONTENT PILLARS =====
  const pillars = [
    {
      name: 'Case Studies',
      slug: 'case-studies',
      color: '#2563EB',
      targetPercentage: 30,
      description: 'Resultados reais de clientes com numeros, ROAS, faturamento. Prova social que demonstra expertise.',
      order: 1,
    },
    {
      name: 'Educacao Tatica',
      slug: 'educacao-tatica',
      color: '#7C3AED',
      targetPercentage: 30,
      description: 'Conteudo educacional pratico sobre e-commerce, performance marketing, estrategia de vendas online.',
      order: 2,
    },
    {
      name: 'Bastidores',
      slug: 'bastidores',
      color: '#EA580C',
      targetPercentage: 20,
      description: 'Dia a dia da agencia, equipe, processos, ferramentas. Humaniza a marca e gera conexao.',
      order: 3,
    },
    {
      name: 'Autoridade',
      slug: 'autoridade',
      color: '#CA8A04',
      targetPercentage: 15,
      description: 'Posicionamento como especialista, opinioes sobre mercado, tendencias, analises do setor.',
      order: 4,
    },
    {
      name: 'Pessoal',
      slug: 'pessoal',
      color: '#EC4899',
      targetPercentage: 5,
      description: 'Vida pessoal do Ivan, lifestyle, bastidores pessoais. Conexao humana com a audiencia.',
      order: 5,
    },
  ];

  const createdPillars: Record<string, string> = {};

  for (const pillar of pillars) {
    const created = await prisma.contentPillar.upsert({
      where: { slug: pillar.slug },
      update: pillar,
      create: pillar,
    });
    createdPillars[pillar.slug] = created.id;
  }

  console.log('Content pillars seeded');

  // ===== HOOKS =====
  const hooks = [
    // Case Studies Hooks
    { text: 'Como geramos R$500k em vendas para uma loja que faturava R$30k/mes', pillarSlug: 'case-studies', format: 'REEL', category: 'STATISTIC' },
    { text: 'Esse e-commerce estava queimando dinheiro em ads. Veja o que fizemos.', pillarSlug: 'case-studies', format: 'REEL', category: 'STORY_HOOK' },
    { text: 'ROAS 8.5x em 60 dias. Aqui esta o passo a passo exato.', pillarSlug: 'case-studies', format: 'CAROUSEL', category: 'STATISTIC' },
    { text: 'Antes e depois de 90 dias com a CDR Group', pillarSlug: 'case-studies', format: 'CAROUSEL', category: 'STORY_HOOK' },
    { text: 'Voce sabia que 80% dos e-commerces perdem dinheiro em trafego pago?', pillarSlug: 'case-studies', format: 'REEL', category: 'QUESTION' },
    { text: '3 mudancas que fizemos e dobramos o faturamento deste cliente', pillarSlug: 'case-studies', format: 'CAROUSEL', category: 'STATISTIC' },

    // Educacao Tatica Hooks
    { text: 'O maior erro que donos de e-commerce cometem com Meta Ads', pillarSlug: 'educacao-tatica', format: 'REEL', category: 'CONTRARIAN' },
    { text: '5 metricas que voce deveria acompanhar todo dia no seu e-commerce', pillarSlug: 'educacao-tatica', format: 'CAROUSEL', category: 'STATISTIC' },
    { text: 'Se voce gasta mais de R$5k/mes em ads e nao faz isso, esta perdendo dinheiro', pillarSlug: 'educacao-tatica', format: 'REEL', category: 'CHALLENGE' },
    { text: 'Seu ROAS esta abaixo de 4x? Entao voce precisa entender isso.', pillarSlug: 'educacao-tatica', format: 'REEL', category: 'QUESTION' },
    { text: 'A estrategia de escala que ninguem te conta sobre Google Ads', pillarSlug: 'educacao-tatica', format: 'CAROUSEL', category: 'CONTRARIAN' },
    { text: 'Como criar uma oferta irresistivel para seu e-commerce em 24 horas', pillarSlug: 'educacao-tatica', format: 'CAROUSEL', category: 'CHALLENGE' },
    { text: 'Meta Ads vs Google Ads: qual investir primeiro?', pillarSlug: 'educacao-tatica', format: 'REEL', category: 'QUESTION' },
    { text: 'Copie essa estrutura de campanha que gera R$100k/mes', pillarSlug: 'educacao-tatica', format: 'CAROUSEL', category: 'STATISTIC' },
    { text: 'O framework de 4 passos para escalar qualquer e-commerce', pillarSlug: 'educacao-tatica', format: 'CAROUSEL', category: 'STATISTIC' },

    // Bastidores Hooks
    { text: 'Um dia na rotina de quem gerencia R$500k em ads por mes', pillarSlug: 'bastidores', format: 'REEL', category: 'STORY_HOOK' },
    { text: 'O que acontece nos bastidores quando um cliente bate recorde', pillarSlug: 'bastidores', format: 'REEL', category: 'STORY_HOOK' },
    { text: 'Reuniao de estrategia com a equipe: como definimos o proximo mes', pillarSlug: 'bastidores', format: 'STORY', category: 'STORY_HOOK' },
    { text: 'As ferramentas que uso todo dia para gerenciar 15+ contas de ads', pillarSlug: 'bastidores', format: 'CAROUSEL', category: 'STATISTIC' },
    { text: 'Como e o processo de onboarding de um novo cliente na CDR', pillarSlug: 'bastidores', format: 'REEL', category: 'STORY_HOOK' },
    { text: 'Setup da minha estacao de trabalho para gestao de trafego', pillarSlug: 'bastidores', format: 'STATIC', category: 'STORY_HOOK' },

    // Autoridade Hooks
    { text: 'Parei de oferecer servico X e tripliquei meu faturamento. Aqui esta o porque.', pillarSlug: 'autoridade', format: 'REEL', category: 'CONTRARIAN' },
    { text: 'Opiniao impopular: a maioria das agencias de performance nao entende de e-commerce', pillarSlug: 'autoridade', format: 'REEL', category: 'CONTRARIAN' },
    { text: '3 tendencias de e-commerce para 2026 que poucos estao vendo', pillarSlug: 'autoridade', format: 'CAROUSEL', category: 'STATISTIC' },
    { text: 'O que aprendi gerenciando mais de R$20 milhoes em vendas online', pillarSlug: 'autoridade', format: 'REEL', category: 'STORY_HOOK' },
    { text: 'Por que agencias de performance vao dominar o mercado de e-commerce', pillarSlug: 'autoridade', format: 'CAROUSEL', category: 'CONTRARIAN' },

    // Pessoal Hooks
    { text: 'Sai do CLT aos 22 anos. Essa e minha historia.', pillarSlug: 'pessoal', format: 'REEL', category: 'STORY_HOOK' },
    { text: 'O dia que quase desisti de empreender (e o que me fez continuar)', pillarSlug: 'pessoal', format: 'REEL', category: 'STORY_HOOK' },
    { text: 'Minha rotina matinal como empreendedor de 23 anos', pillarSlug: 'pessoal', format: 'STORY', category: 'STORY_HOOK' },
    { text: 'Final de semana de quem fatura 6 digitos/mes com marketing digital', pillarSlug: 'pessoal', format: 'REEL', category: 'STORY_HOOK' },

    // Universal Hooks (no specific pillar)
    { text: 'Salve esse post se voce quer escalar seu e-commerce', pillarSlug: null, format: 'ALL', category: 'CHALLENGE' },
    { text: 'Comenta SIM se voce quer receber mais conteudo como esse', pillarSlug: null, format: 'ALL', category: 'CHALLENGE' },
  ];

  for (const hook of hooks) {
    await prisma.hook.create({
      data: {
        text: hook.text,
        pillarId: hook.pillarSlug ? createdPillars[hook.pillarSlug] : null,
        format: hook.format,
        category: hook.category,
      },
    });
  }

  console.log(`${hooks.length} hooks seeded`);

  // ===== CHECKLIST TEMPLATES =====
  const checklists = [
    {
      stage: 'SCRIPT',
      items: JSON.stringify([
        'Hook validado?',
        'CTA definido?',
        'Pilar correto?',
        'Roteiro completo?',
      ]),
    },
    {
      stage: 'PRODUCTION',
      items: JSON.stringify([
        'Gravacao concluida?',
        'Audio ok?',
        'Iluminacao ok?',
        'Edicao finalizada?',
      ]),
    },
    {
      stage: 'REVIEW',
      items: JSON.stringify([
        'Caption revisada?',
        'Hashtags incluidas?',
        'Thumbnail aprovada?',
        'Alinhado com pilar?',
        'CTA claro?',
      ]),
    },
    {
      stage: 'SCHEDULED',
      items: JSON.stringify([
        'Horario otimo?',
        'Preview final aprovado?',
        'Stories de apoio planejados?',
      ]),
    },
  ];

  for (const checklist of checklists) {
    await prisma.checklistTemplate.upsert({
      where: { stage: checklist.stage },
      update: { items: checklist.items },
      create: checklist,
    });
  }

  console.log('Checklist templates seeded');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
