'use client';

import { TrendingUp, Quote, Edit, Trash2, ArrowRight, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClientResult, MetricType } from '@/types';

interface ResultCardProps {
  result: ClientResult;
  onEdit: (result: ClientResult) => void;
  onDelete: (id: string) => void;
  onTransformToPost: (result: ClientResult) => void;
}

const METRIC_LABELS: Record<MetricType, string> = {
  ROAS: 'ROAS',
  REVENUE: 'Faturamento',
  GROWTH: 'Crescimento',
  CAC: 'CAC',
  OTHER: 'Outro',
} as const;

const METRIC_COLORS: Record<MetricType, string> = {
  ROAS: 'text-success',
  REVENUE: 'text-accent',
  GROWTH: 'text-info',
  CAC: 'text-warning',
  OTHER: 'text-text-secondary',
} as const;

export default function ResultCard({ result, onEdit, onDelete, onTransformToPost }: ResultCardProps) {
  const metricLabel = METRIC_LABELS[result.metricType as MetricType] || result.metricType;
  const metricColor = METRIC_COLORS[result.metricType as MetricType] || 'text-text-secondary';
  const hasImages = result.images && result.images.length > 0;

  return (
    <div className="card card-hover p-5 animate-fade-in">
      {/* Header: Client name + niche badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-heading-3 text-text-primary truncate">{result.clientName}</h3>
          <span className="badge bg-accent-surface text-accent text-[10px] mt-1">
            {result.clientNiche}
          </span>
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <button
            onClick={() => onEdit(result)}
            className="p-1.5 rounded-[var(--radius-sm)] hover:bg-bg-hover transition-colors text-text-tertiary hover:text-text-primary"
            title="Editar"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onDelete(result.id)}
            className="p-1.5 rounded-[var(--radius-sm)] hover:bg-error-surface transition-colors text-text-tertiary hover:text-error"
            title="Excluir"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Metric highlight */}
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={16} className={metricColor} />
        <span className={cn('text-xl font-bold', metricColor)}>
          {result.metricValue}{result.metricUnit}
        </span>
        <span className="text-xs text-text-secondary">de {metricLabel}</span>
      </div>

      {/* Period */}
      <p className="text-xs text-text-tertiary mb-2">
        Periodo: {result.period}
      </p>

      {/* Description */}
      {result.description && (
        <p className="text-sm text-text-secondary line-clamp-2 mb-3">
          {result.description}
        </p>
      )}

      {/* Testimonial snippet */}
      {result.testimonialText && (
        <div className="flex items-start gap-2 bg-bg-secondary rounded-[var(--radius-sm)] p-3 mb-3">
          <Quote size={12} className="text-text-tertiary shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary italic line-clamp-2">
            {result.testimonialText}
          </p>
        </div>
      )}

      {/* Images indicator */}
      {hasImages && (
        <div className="flex items-center gap-1 text-xs text-text-tertiary mb-3">
          <ImageIcon size={12} />
          <span>{result.images!.length} imagem(ns)</span>
        </div>
      )}

      {/* Footer: Transform button */}
      <button
        onClick={() => onTransformToPost(result)}
        className="btn-accent w-full flex items-center justify-center gap-2 text-xs py-2"
      >
        <span>Transformar em Post</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
