import type { PostFormat } from '@/types';

export interface FrameworkField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'textarea';
  required?: boolean;
}

export interface ContentFramework {
  format: PostFormat;
  label: string;
  description: string;
  fields: FrameworkField[];
}

export const FRAMEWORKS: Record<PostFormat, ContentFramework> = {
  REEL: {
    format: 'REEL',
    label: 'Reel',
    description: 'Vídeo curto com estrutura narrativa',
    fields: [
      {
        key: 'hook',
        label: 'Hook',
        placeholder: 'Uma frase impactante que prende a atenção nos primeiros 3 segundos',
        type: 'text',
        required: true,
      },
      {
        key: 'problem',
        label: 'Problema',
        placeholder: 'Descreva o problema ou dor que a audiência enfrenta',
        type: 'textarea',
      },
      {
        key: 'solution',
        label: 'Framework / Solução',
        placeholder: 'Apresente sua solução ou framework em passos claros',
        type: 'textarea',
      },
      {
        key: 'proof',
        label: 'Prova',
        placeholder: 'Dados, números ou case que comprovam o resultado',
        type: 'textarea',
      },
      {
        key: 'cta',
        label: 'CTA',
        placeholder: 'Chamada para ação: seguir, comentar, salvar, compartilhar',
        type: 'text',
      },
    ],
  },
  CAROUSEL: {
    format: 'CAROUSEL',
    label: 'Carrossel',
    description: 'Slides com conteúdo educacional ou case study',
    fields: [
      {
        key: 'cover',
        label: 'Capa',
        placeholder: 'Título impactante do carrossel (máximo 8 palavras)',
        type: 'text',
        required: true,
      },
      {
        key: 'slide1',
        label: 'Slide 1',
        placeholder: 'Título + corpo do slide 1',
        type: 'textarea',
      },
      {
        key: 'slide2',
        label: 'Slide 2',
        placeholder: 'Título + corpo do slide 2',
        type: 'textarea',
      },
      {
        key: 'slide3',
        label: 'Slide 3',
        placeholder: 'Título + corpo do slide 3',
        type: 'textarea',
      },
      {
        key: 'slide4',
        label: 'Slide 4',
        placeholder: 'Título + corpo do slide 4',
        type: 'textarea',
      },
      {
        key: 'slide5',
        label: 'Slide 5',
        placeholder: 'Título + corpo do slide 5 (opcional)',
        type: 'textarea',
      },
      {
        key: 'slide6',
        label: 'Slide 6',
        placeholder: 'Título + corpo do slide 6 (opcional)',
        type: 'textarea',
      },
      {
        key: 'slide7',
        label: 'Slide 7',
        placeholder: 'Título + corpo do slide 7 (opcional)',
        type: 'textarea',
      },
      {
        key: 'slide8',
        label: 'Slide 8',
        placeholder: 'Título + corpo do slide 8 (opcional)',
        type: 'textarea',
      },
      {
        key: 'cta',
        label: 'CTA Final',
        placeholder: 'Último slide com chamada para ação',
        type: 'text',
      },
    ],
  },
  STATIC: {
    format: 'STATIC',
    label: 'Post Estático',
    description: 'Imagem única com caption elaborada',
    fields: [
      {
        key: 'image',
        label: 'Imagem',
        placeholder: 'Descrição da imagem: tipo, cenário, texto overlay, cores',
        type: 'textarea',
        required: true,
      },
      {
        key: 'caption',
        label: 'Caption',
        placeholder: 'Texto completo do caption com quebras de linha, emojis e formatação',
        type: 'textarea',
      },
      {
        key: 'hashtags',
        label: 'Hashtags',
        placeholder: '#ecommerce #marketingdigital #vendasonline',
        type: 'text',
      },
    ],
  },
  STORY: {
    format: 'STORY',
    label: 'Story',
    description: 'Conteúdo efêmero para stories do Instagram',
    fields: [
      {
        key: 'visual',
        label: 'Visual',
        placeholder: 'Descrição do visual: foto, vídeo, fundo, sticker',
        type: 'textarea',
        required: true,
      },
      {
        key: 'text_overlay',
        label: 'Texto Overlay',
        placeholder: 'Texto que aparece sobre a imagem/vídeo',
        type: 'textarea',
      },
      {
        key: 'cta',
        label: 'CTA',
        placeholder: 'Ação esperada: responder enquete, swipe up, DM',
        type: 'text',
      },
    ],
  },
} as const;

export const PILLAR_HASHTAG_SUGGESTIONS: Record<string, string[]> = {
  'case-studies': [
    '#casesdesucesso', '#ecommerce', '#resultados', '#roi', '#roas',
    '#marketingdeperformance', '#vendasonline', '#trafegopago',
  ],
  'educacao-tatica': [
    '#marketingdigital', '#dicasecommerce', '#metaads', '#googleads',
    '#trafegopago', '#escalaronline', '#ecommercebrasil',
  ],
  'bastidores': [
    '#bastidores', '#rotina', '#agenciadigital', '#behindthescenes',
    '#equipedigital', '#dayinmylife',
  ],
  'autoridade': [
    '#autoridade', '#especialista', '#tendencias', '#marketingdigital',
    '#estrategia', '#mercadodigital',
  ],
  'pessoal': [
    '#empreendedorismo', '#lifestyle', '#empreendedor', '#jornada',
    '#motivacao', '#mindset',
  ],
};

export function getHashtagSuggestions(pillarSlug: string | undefined): string[] {
  if (!pillarSlug) return [];
  return PILLAR_HASHTAG_SUGGESTIONS[pillarSlug] || [];
}
