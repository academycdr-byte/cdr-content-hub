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
    description: 'Video curto com estrutura narrativa',
    fields: [
      {
        key: 'hook',
        label: 'Hook',
        placeholder: 'Uma frase impactante que prende a atencao nos primeiros 3 segundos',
        type: 'text',
        required: true,
      },
      {
        key: 'problem',
        label: 'Problema',
        placeholder: 'Descreva o problema ou dor que a audiencia enfrenta',
        type: 'textarea',
      },
      {
        key: 'solution',
        label: 'Framework / Solucao',
        placeholder: 'Apresente sua solucao ou framework em passos claros',
        type: 'textarea',
      },
      {
        key: 'proof',
        label: 'Prova',
        placeholder: 'Dados, numeros ou case que comprovam o resultado',
        type: 'textarea',
      },
      {
        key: 'cta',
        label: 'CTA',
        placeholder: 'Chamada para acao: seguir, comentar, salvar, compartilhar',
        type: 'text',
      },
    ],
  },
  CAROUSEL: {
    format: 'CAROUSEL',
    label: 'Carrossel',
    description: 'Slides com conteudo educacional ou case study',
    fields: [
      {
        key: 'cover',
        label: 'Capa',
        placeholder: 'Titulo impactante do carrossel (maximo 8 palavras)',
        type: 'text',
        required: true,
      },
      {
        key: 'slide1',
        label: 'Slide 1',
        placeholder: 'Titulo + corpo do slide 1',
        type: 'textarea',
      },
      {
        key: 'slide2',
        label: 'Slide 2',
        placeholder: 'Titulo + corpo do slide 2',
        type: 'textarea',
      },
      {
        key: 'slide3',
        label: 'Slide 3',
        placeholder: 'Titulo + corpo do slide 3',
        type: 'textarea',
      },
      {
        key: 'slide4',
        label: 'Slide 4',
        placeholder: 'Titulo + corpo do slide 4',
        type: 'textarea',
      },
      {
        key: 'slide5',
        label: 'Slide 5',
        placeholder: 'Titulo + corpo do slide 5 (opcional)',
        type: 'textarea',
      },
      {
        key: 'slide6',
        label: 'Slide 6',
        placeholder: 'Titulo + corpo do slide 6 (opcional)',
        type: 'textarea',
      },
      {
        key: 'slide7',
        label: 'Slide 7',
        placeholder: 'Titulo + corpo do slide 7 (opcional)',
        type: 'textarea',
      },
      {
        key: 'slide8',
        label: 'Slide 8',
        placeholder: 'Titulo + corpo do slide 8 (opcional)',
        type: 'textarea',
      },
      {
        key: 'cta',
        label: 'CTA Final',
        placeholder: 'Ultimo slide com chamada para acao',
        type: 'text',
      },
    ],
  },
  STATIC: {
    format: 'STATIC',
    label: 'Post Estatico',
    description: 'Imagem unica com caption elaborada',
    fields: [
      {
        key: 'image',
        label: 'Imagem',
        placeholder: 'Descricao da imagem: tipo, cenario, texto overlay, cores',
        type: 'textarea',
        required: true,
      },
      {
        key: 'caption',
        label: 'Caption',
        placeholder: 'Texto completo do caption com quebras de linha, emojis e formatacao',
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
    description: 'Conteudo efemero para stories do Instagram',
    fields: [
      {
        key: 'visual',
        label: 'Visual',
        placeholder: 'Descricao do visual: foto, video, fundo, sticker',
        type: 'textarea',
        required: true,
      },
      {
        key: 'text_overlay',
        label: 'Texto Overlay',
        placeholder: 'Texto que aparece sobre a imagem/video',
        type: 'textarea',
      },
      {
        key: 'cta',
        label: 'CTA',
        placeholder: 'Acao esperada: responder enquete, swipe up, DM',
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
