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

const METRIC_COLORS: Record<MetricType, { bg: string; text: string }> = {
  ROAS: { bg: 'rgba(52, 199, 89, 0.12)', text: '#34C759' },
  REVENUE: { bg: 'rgba(184, 255, 0, 0.12)', text: '#B8FF00' },
  GROWTH: { bg: 'rgba(48, 176, 199, 0.12)', text: '#30B0C7' },
  CAC: { bg: 'rgba(255, 159, 10, 0.12)', text: '#FF9F0A' },
  OTHER: { bg: 'rgba(142, 142, 147, 0.12)', text: '#8E8E93' },
} as const;

export default function ResultCard({ result, onEdit, onDelete, onTransformToPost }: ResultCardProps) {
  const metricLabel = METRIC_LABELS[result.metricType as MetricType] || result.metricType;
  const colors = METRIC_COLORS[result.metricType as MetricType] || METRIC_COLORS.OTHER;
  const hasImages = result.images && result.images.length > 0;

  return (
    <div className="card card-hover p-0 animate-fade-in overflow-hidden">
      {/* Metric highlight banner */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            <TrendingUp size={12} />
            {metricLabel}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => onEdit(result)}
              className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors text-text-tertiary hover:text-text-primary"
              title="Editar"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => onDelete(result.id)}
              className="p-1.5 rounded-lg hover:bg-error-surface transition-colors text-text-tertiary hover:text-error"
              title="Excluir"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Big metric number */}
        <div className="mb-3">
          <p className="text-2xl font-bold text-text-primary leading-tight">
            {result.metricValue}
            <span className="text-base font-semibold text-text-tertiary ml-0.5">
              {result.metricUnit}
            </span>
          </p>
          <p className="text-xs text-text-tertiary mt-0.5">
            em {result.period}
          </p>
        </div>

        {/* Client info */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold shrink-0"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {result.clientName.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{result.clientName}</p>
            <p className="text-[11px] text-text-tertiary">{result.clientNiche}</p>
          </div>
        </div>

        {/* Description */}
        {result.description && (
          <p className="text-xs text-text-secondary line-clamp-2 mb-3">
            {result.description}
          </p>
        )}

        {/* Testimonial snippet */}
        {result.testimonialText && (
          <div className="flex items-start gap-2 bg-bg-secondary rounded-lg p-3 mb-3">
            <Quote size={10} className="text-text-tertiary shrink-0 mt-0.5" />
            <p className="text-[11px] text-text-secondary italic line-clamp-2">
              {result.testimonialText}
            </p>
          </div>
        )}

        {/* Images indicator */}
        {hasImages && (
          <div className="flex items-center gap-1 text-[11px] text-text-tertiary mb-1">
            <ImageIcon size={11} />
            <span>{result.images!.length} evidencia(s)</span>
          </div>
        )}
      </div>

      {/* Footer: Transform button */}
      <div className="px-5 py-3 border-t border-border-default">
        <button
          onClick={() => onTransformToPost(result)}
          className="flex w-full items-center justify-center gap-2 text-xs font-medium text-accent hover:text-accent-hover transition-colors py-1"
        >
          <span>Transformar em Case Study</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
