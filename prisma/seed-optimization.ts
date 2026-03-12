import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
}

async function main() {
  console.log('=== Content Hub Optimization Seed ===\n');

  // -------------------------------------------------------
  // 0. Find social accounts
  // -------------------------------------------------------
  const allAccounts = await prisma.socialAccount.findMany();
  const ivanAccount = allAccounts.find((a) => a.username === 'ivanfurtado.cdr');
  const cdrAccount = allAccounts.find((a) => a.username === 'cdrgroup.assessoria');

  if (!ivanAccount) {
    console.error('Account @ivanfurtado.cdr not found. Aborting.');
    return;
  }
  console.log(`Found @ivanfurtado.cdr (id: ${ivanAccount.id})`);

  if (cdrAccount) {
    console.log(`Found @cdrgroup.assessoria (id: ${cdrAccount.id})`);
  } else {
    console.warn('Account @cdrgroup.assessoria not found. Skipping CDR-specific seeds.');
  }

  // -------------------------------------------------------
  // 1. Delete old global pillars and create per-profile ones
  // -------------------------------------------------------
  console.log('\n--- 1. Pilares Multi-Perfil ---');

  // First deactivate old global pillars (no socialAccountId)
  const oldPillars = await prisma.contentPillar.findMany({
    where: { socialAccountId: null },
  });

  if (oldPillars.length > 0) {
    // We need a default pillar for posts that reference old pillars
    console.log(`Found ${oldPillars.length} global pillars to replace.`);
  }

  // Ivan pillars
  const ivanPillarsData = [
    { name: 'Jornada Real', slug: 'jornada-real', color: '#2563EB', targetPercentage: 30, description: 'Historia real do Ivan como CEO de 23 anos, pai, construindo a CDR do zero. Serie ancora: CDR De Zero a 1M', order: 1 },
    { name: 'Performance na Pratica', slug: 'performance-pratica', color: '#7C3AED', targetPercentage: 25, description: 'Ensinar e-commerce e performance marketing com dados reais, tela real, experiencia propria', order: 2 },
    { name: 'Opiniao Forte', slug: 'opiniao-forte', color: '#EA580C', targetPercentage: 20, description: 'Posicionamentos polemicos e honestos. Serie ancora: Cafe com Anti-Guru', order: 3 },
    { name: 'Bastidores CDR', slug: 'bastidores-cdr-ivan', color: '#CA8A04', targetPercentage: 15, description: 'Cases reais de clientes com numeros, resultados, processo. Prova social organica', order: 4 },
    { name: 'Lifestyle CEO', slug: 'lifestyle-ceo', color: '#EC4899', targetPercentage: 10, description: 'Pai aos 21, CEO aos 22. Rotina, familia, lado humano', order: 5 },
  ];

  const ivanPillarMap: Record<string, string> = {};
  for (const p of ivanPillarsData) {
    const created = await prisma.contentPillar.upsert({
      where: { slug_socialAccountId: { slug: p.slug, socialAccountId: ivanAccount.id } },
      update: { name: p.name, color: p.color, targetPercentage: p.targetPercentage, description: p.description, order: p.order, isActive: true },
      create: { id: generateId(), ...p, socialAccountId: ivanAccount.id },
    });
    ivanPillarMap[p.slug] = created.id;
    console.log(`  Ivan pillar: ${p.name} (${created.id})`);
  }

  // CDR pillars
  const cdrPillarMap: Record<string, string> = {};
  if (cdrAccount) {
    const cdrPillarsData = [
      { name: 'Educacao Tecnica', slug: 'educacao-tecnica', color: '#2563EB', targetPercentage: 35, description: 'Conteudo educativo sobre performance marketing, metricas, estrategia. Series: Metodo ACESSO, ROAS vs Lucro', order: 1 },
      { name: 'Prova Social / Cases', slug: 'prova-social', color: '#16A34A', targetPercentage: 30, description: 'Resultados reais de clientes CDR com numeros, transparencia radical. Serie: Resultado do Mes', order: 2 },
      { name: 'Visao de Mercado', slug: 'visao-mercado', color: '#7C3AED', targetPercentage: 20, description: 'Analises de tendencias, CPMs, mudancas no Meta Ads, posicionamento consultivo', order: 3 },
      { name: 'Bastidores CDR', slug: 'bastidores-cdr', color: '#CA8A04', targetPercentage: 15, description: 'Como a CDR opera internamente, dashboard, processos, time. Transparencia como diferencial', order: 4 },
    ];

    for (const p of cdrPillarsData) {
      const created = await prisma.contentPillar.upsert({
        where: { slug_socialAccountId: { slug: p.slug, socialAccountId: cdrAccount.id } },
        update: { name: p.name, color: p.color, targetPercentage: p.targetPercentage, description: p.description, order: p.order, isActive: true },
        create: { id: generateId(), ...p, socialAccountId: cdrAccount.id },
      });
      cdrPillarMap[p.slug] = created.id;
      console.log(`  CDR pillar: ${p.name} (${created.id})`);
    }
  }

  // Deactivate old global pillars
  if (oldPillars.length > 0) {
    await prisma.contentPillar.updateMany({
      where: { socialAccountId: null },
      data: { isActive: false },
    });
    console.log(`  Deactivated ${oldPillars.length} old global pillars.`);
  }

  // -------------------------------------------------------
  // 2. Series
  // -------------------------------------------------------
  console.log('\n--- 2. Series de Conteudo ---');

  // Ivan series
  const ivanSeriesData = [
    { name: 'CDR De Zero a 1M', slug: 'cdr-zero-1m', frequency: 'weekly', color: '#2563EB', description: 'Documentario: de 0 a 1M seguidores. Cada EP mostra um marco real.' },
    { name: 'Cafe com Anti-Guru', slug: 'cafe-anti-guru', frequency: 'weekly', color: '#EA580C', description: 'Opinioes polemicas sobre mercado digital. Tom direto, dados na mesa.' },
  ];

  for (const s of ivanSeriesData) {
    const existing = await prisma.contentSeries.findUnique({ where: { slug: s.slug } });
    if (!existing) {
      await prisma.contentSeries.create({
        data: { ...s, socialAccountId: ivanAccount.id },
      });
      console.log(`  Created ivan series: ${s.name}`);
    } else {
      console.log(`  Ivan series already exists: ${s.name}`);
    }
  }

  // CDR series
  if (cdrAccount) {
    const cdrSeriesData = [
      { name: 'Diagnostico CDR', slug: 'diagnostico-cdr', frequency: 'monthly', color: '#2563EB', description: 'Screencast de auditoria real de conta de ads.' },
      { name: 'Metodo A.C.E.S.S.O.', slug: 'metodo-acesso', frequency: 'monthly', totalEpisodes: 6, color: '#16A34A', description: '6 episodios, um por etapa: Auditoria, Calibracao, Escala, Sustentacao, Sistematizacao, Otimizacao.' },
      { name: 'Resultado do Mes', slug: 'resultado-mes', frequency: 'monthly', color: '#7C3AED', description: 'Report mensal com numeros reais dos clientes, incluindo resultados ruins.' },
    ];

    for (const s of cdrSeriesData) {
      const existing = await prisma.contentSeries.findUnique({ where: { slug: s.slug } });
      if (!existing) {
        await prisma.contentSeries.create({
          data: { ...s, socialAccountId: cdrAccount.id },
        });
        console.log(`  Created CDR series: ${s.name}`);
      } else {
        console.log(`  CDR series already exists: ${s.name}`);
      }
    }
  }

  // -------------------------------------------------------
  // 3. DM Keywords
  // -------------------------------------------------------
  console.log('\n--- 3. DM Keywords ---');

  const ivanKeywords = [
    { keyword: 'DIAGNOSTICO', description: 'Pedir diagnostico gratuito da conta de ads' },
    { keyword: 'CHECKLIST', description: 'Receber checklist de 7 sinais + de escala' },
    { keyword: 'RESULTADO', description: 'Ver resultados da CDR' },
  ];

  for (const k of ivanKeywords) {
    const existing = await prisma.dmKeyword.findFirst({
      where: { keyword: k.keyword, socialAccountId: ivanAccount.id },
    });
    if (!existing) {
      await prisma.dmKeyword.create({
        data: { ...k, socialAccountId: ivanAccount.id },
      });
      console.log(`  Created ivan keyword: ${k.keyword}`);
    } else {
      console.log(`  Ivan keyword already exists: ${k.keyword}`);
    }
  }

  if (cdrAccount) {
    const cdrKeywords = [
      { keyword: 'DIAGNOSTICO', description: 'Auditoria gratuita da conta de ads' },
      { keyword: 'RESULTADO', description: 'Ver report mensal completo' },
      { keyword: 'ACESSO', description: 'Conhecer o Metodo ACESSO' },
      { keyword: 'CHECKLIST', description: 'Receber checklist de sinais' },
      { keyword: 'MARGEM', description: 'Calcular margem real da operacao' },
      { keyword: 'DASHBOARD', description: 'Demo do dashboard de acompanhamento CDR' },
      { keyword: 'ESCALAR', description: 'Analise de posicionamento pra CPMs altos' },
    ];

    for (const k of cdrKeywords) {
      const existing = await prisma.dmKeyword.findFirst({
        where: { keyword: k.keyword, socialAccountId: cdrAccount.id },
      });
      if (!existing) {
        await prisma.dmKeyword.create({
          data: { ...k, socialAccountId: cdrAccount.id },
        });
        console.log(`  Created CDR keyword: ${k.keyword}`);
      } else {
        console.log(`  CDR keyword already exists: ${k.keyword}`);
      }
    }
  }

  // -------------------------------------------------------
  // 4. CPM Config
  // -------------------------------------------------------
  console.log('\n--- 4. CPM Config ---');

  const cpmConfig = [
    { format: 'REEL', cpmValue: 8.0 },
    { format: 'CAROUSEL', cpmValue: 5.0 },
    { format: 'STATIC', cpmValue: 3.0 },
    { format: 'STORY', cpmValue: 2.0 },
  ];

  for (const c of cpmConfig) {
    await prisma.commissionConfig.upsert({
      where: { format: c.format },
      update: { cpmValue: c.cpmValue },
      create: { id: generateId(), format: c.format, cpmValue: c.cpmValue },
    });
    console.log(`  CPM ${c.format}: R$ ${c.cpmValue.toFixed(2)}`);
  }

  // -------------------------------------------------------
  // 5. Assign pilares to existing posts
  // -------------------------------------------------------
  console.log('\n--- 5. Atribuir Pilares aos Posts ---');

  const allPosts = await prisma.post.findMany({
    select: { id: true, title: true, pillarId: true, socialAccountId: true },
  });

  // Mapping: post title partial match → { account, pillarSlug }
  const postPillarMapping: Array<{
    titleMatch: string;
    account: 'ivan' | 'cdr';
    pillarSlug: string;
  }> = [
    { titleMatch: 'CDR De Zero a 1M #01', account: 'ivan', pillarSlug: 'jornada-real' },
    { titleMatch: 'CDR De Zero a 1M #02', account: 'ivan', pillarSlug: 'jornada-real' },
    { titleMatch: 'CDR De Zero a 1M #03', account: 'ivan', pillarSlug: 'jornada-real' },
    { titleMatch: 'Diagnostico CDR', account: 'cdr', pillarSlug: 'educacao-tecnica' },
    { titleMatch: '7 sinais', account: 'cdr', pillarSlug: 'educacao-tecnica' },
    { titleMatch: '3 sinais gestor', account: 'ivan', pillarSlug: 'performance-pratica' },
    { titleMatch: 'Cafe com Anti-Guru #05', account: 'ivan', pillarSlug: 'opiniao-forte' },
    { titleMatch: 'Cafe com anti-guru', account: 'ivan', pillarSlug: 'opiniao-forte' },
    { titleMatch: 'Case Puro Conforto', account: 'cdr', pillarSlug: 'prova-social' },
    { titleMatch: 'Sai do CLT', account: 'ivan', pillarSlug: 'jornada-real' },
    { titleMatch: 'CPMs subiram', account: 'cdr', pillarSlug: 'visao-mercado' },
    { titleMatch: 'Da Roi ou nao', account: 'ivan', pillarSlug: 'opiniao-forte' },
    { titleMatch: 'Metodo ACESSO', account: 'cdr', pillarSlug: 'educacao-tecnica' },
    { titleMatch: 'Checklist escalar', account: 'ivan', pillarSlug: 'performance-pratica' },
    { titleMatch: 'Desenvolvi site', account: 'ivan', pillarSlug: 'bastidores-cdr-ivan' },
    { titleMatch: 'Dashboard CDR', account: 'cdr', pillarSlug: 'bastidores-cdr' },
    { titleMatch: 'Meu filho', account: 'ivan', pillarSlug: 'lifestyle-ceo' },
    { titleMatch: 'Resultado marco CDR', account: 'cdr', pillarSlug: 'prova-social' },
    { titleMatch: 'ROAS nao e lucro', account: 'cdr', pillarSlug: 'educacao-tecnica' },
    { titleMatch: 'Resultado marco pessoal', account: 'ivan', pillarSlug: 'bastidores-cdr-ivan' },
    { titleMatch: 'Meta pequena ou grande', account: 'ivan', pillarSlug: 'opiniao-forte' },
    { titleMatch: 'Erros que travam', account: 'cdr', pillarSlug: 'educacao-tecnica' },
  ];

  let assignedCount = 0;
  for (const mapping of postPillarMapping) {
    const post = allPosts.find((p) =>
      p.title.toLowerCase().includes(mapping.titleMatch.toLowerCase())
    );
    if (!post) {
      console.log(`  Post not found: "${mapping.titleMatch}"`);
      continue;
    }

    const pillarMap = mapping.account === 'ivan' ? ivanPillarMap : cdrPillarMap;
    const pillarId = pillarMap[mapping.pillarSlug];
    const accountId = mapping.account === 'ivan' ? ivanAccount.id : cdrAccount?.id;

    if (!pillarId) {
      console.log(`  Pillar not found: ${mapping.pillarSlug} for "${mapping.titleMatch}"`);
      continue;
    }

    await prisma.post.update({
      where: { id: post.id },
      data: {
        pillarId,
        socialAccountId: accountId || post.socialAccountId,
      },
    });
    assignedCount++;
  }
  console.log(`  Assigned pilares to ${assignedCount} posts.`);

  // -------------------------------------------------------
  // 6. Remove test post
  // -------------------------------------------------------
  console.log('\n--- 6. Remover Post de Teste ---');

  const testPost = allPosts.find((p) => p.title.toLowerCase() === 'teste');
  if (testPost) {
    await prisma.post.delete({ where: { id: testPost.id } });
    console.log('  Removed test post "teste".');
  } else {
    console.log('  No test post found.');
  }

  // -------------------------------------------------------
  // 7. Case Puro Conforto
  // -------------------------------------------------------
  console.log('\n--- 7. Case Puro Conforto ---');

  const existingResult = await prisma.clientResult.findFirst({
    where: { clientName: 'Puro Conforto' },
  });

  if (!existingResult) {
    await prisma.clientResult.create({
      data: {
        id: generateId(),
        clientName: 'Puro Conforto',
        clientNiche: 'E-commerce de Moda/Conforto',
        metricType: 'Faturamento',
        metricValue: 'R$ 400.000',
        metricUnit: 'R$',
        period: '4 meses com CDR',
        description: 'E-commerce que faturava R$20k/mes. Apos auditoria completa (Metodo ACESSO), reestruturacao de campanhas e estrategia de escala agressiva, atingiu R$400k/mes em 4 meses. ROAS liquido medio: 3.2.',
      },
    });
    console.log('  Created case Puro Conforto.');
  } else {
    console.log('  Case Puro Conforto already exists.');
  }

  // -------------------------------------------------------
  // 8. Update Checklists with new items
  // -------------------------------------------------------
  console.log('\n--- 8. Atualizar Checklists ---');

  const updatedChecklists = [
    {
      stage: 'SCRIPT',
      items: JSON.stringify([
        'Hook validado?',
        'CTA definido?',
        'Pilar correto?',
        'Roteiro completo?',
        'DM keyword definida?',
        'Cross-post planejado? (existe post irmao no outro perfil?)',
        'Serie identificada? (EP# definido?)',
      ]),
    },
    {
      stage: 'PRODUCTION',
      items: JSON.stringify([
        'Gravacao concluida?',
        'Audio ok?',
        'Iluminacao ok?',
        'Edicao finalizada?',
        'Cenario adequado? (profissional pra CDR, casual pra Ivan)',
        'Enquadramento vertical? (9:16 pra Reels)',
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
        'Legendas/subtitulos adicionados? (pra Reels)',
        'Visual segue brandbook CDR? (paleta, tipografia)',
        'Duracao dentro do alvo? (pra Reels: 45-60s)',
      ]),
    },
    {
      stage: 'SCHEDULED',
      items: JSON.stringify([
        'Horario otimo?',
        'Preview final aprovado?',
        'Stories de apoio planejados?',
        'Post irmao agendado no outro perfil?',
        'Primeiro comentario preparado? (hashtags)',
      ]),
    },
  ];

  for (const checklist of updatedChecklists) {
    await prisma.checklistTemplate.upsert({
      where: { stage: checklist.stage },
      update: { items: checklist.items },
      create: { id: generateId(), ...checklist },
    });
    console.log(`  Updated checklist: ${checklist.stage}`);
  }

  console.log('\n=== Optimization seed complete! ===');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
