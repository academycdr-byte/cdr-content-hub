'use client';

import { DollarSign, Check, Clock } from 'lucide-react';
import type { CommissionStats } from '@/types';

interface CommissionSummaryProps {
  stats: CommissionStats | null;
  loading: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

const STAT_CARDS = [
  {
    key: 'total' as const,
    label: 'Total Comissoes',
    icon: DollarSign,
    color: 'var(--accent)',
    bgColor: 'var(--accent-surface)',
  },
  {
    key: 'paid' as const,
    label: 'Pagas',
    icon: Check,
    color: 'var(--success)',
    bgColor: 'var(--success-surface)',
  },
  {
    key: 'pending' as const,
    label: 'Pendentes',
    icon: Clock,
    color: 'var(--warning)',
    bgColor: 'var(--warning-surface)',
  },
] as const;

export default function CommissionSummary({ stats, loading }: CommissionSummaryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-[120px]" />
        ))}
      </div>
    );
  }

  const values = {
    total: stats?.total || 0,
    paid: stats?.paid || 0,
    pending: stats?.pending || 0,
  };

  const pctPaid = values.total > 0 ? Math.round((values.paid / values.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          const value = values[card.key];
          return (
            <div key={card.key} className="card p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: card.bgColor }}
                >
                  <Icon size={20} style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {formatCurrency(value)}
              </p>
              <p className="text-xs text-text-secondary mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      {values.total > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-text-secondary">
              Progresso de pagamento
            </p>
            <p className="text-sm font-bold text-text-primary">{pctPaid}%</p>
          </div>
          <div className="w-full rounded-full h-2.5 bg-bg-hover">
            <div
              className="h-2.5 rounded-full transition-all duration-700"
              style={{
                width: `${pctPaid}%`,
                backgroundColor: pctPaid === 100 ? 'var(--success)' : 'var(--accent)',
              }}
            />
          </div>
          <p className="text-[11px] text-text-tertiary mt-1.5">
            {stats?.count || 0} comissoes no total
          </p>
        </div>
      )}
    </div>
  );
}
