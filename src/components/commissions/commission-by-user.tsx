'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Commission } from '@/types';

interface CommissionByUserProps {
  commissions: Commission[];
  loading: boolean;
  month: string;
  onMarkPaid: (id: string) => Promise<void>;
  onMarkUnpaid: (id: string) => Promise<void>;
  onMarkAllPaid: (userId: string, month: string) => Promise<void>;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(
      value / 1_000_000
    ) + 'M';
  }
  if (value >= 1_000) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(
      value / 1_000
    ) + 'K';
  }
  return new Intl.NumberFormat('pt-BR').format(value);
}

interface UserGroup {
  userId: string;
  name: string;
  email: string;
  commissions: Commission[];
  total: number;
  paid: number;
}

export default function CommissionByUser({
  commissions,
  loading,
  month,
  onMarkPaid,
  onMarkUnpaid,
  onMarkAllPaid,
}: CommissionByUserProps) {
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const grouped = useMemo(() => {
    const map = new Map<string, UserGroup>();

    for (const c of commissions) {
      if (!c.user) continue;

      if (!map.has(c.userId)) {
        map.set(c.userId, {
          userId: c.userId,
          name: c.user.name,
          email: c.user.email,
          commissions: [],
          total: 0,
          paid: 0,
        });
      }

      const group = map.get(c.userId)!;
      group.commissions.push(c);
      group.total += c.amount;
      if (c.isPaid) group.paid += c.amount;
    }

    let result = Array.from(map.values()).sort((a, b) => b.total - a.total);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) => g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q)
      );
    }

    return result;
  }, [commissions, search]);

  const toggleExpand = (userId: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-[80px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          className="input pl-10"
          placeholder="Buscar colaborador..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* User Accordion */}
      {grouped.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <p className="text-sm text-text-secondary">
            Nenhuma comissao encontrada para o filtro atual.
          </p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {grouped.map((group) => {
            const expanded = expandedUsers.has(group.userId);
            const pctPaid = group.total > 0
              ? Math.round((group.paid / group.total) * 100)
              : 0;
            const pendingCount = group.commissions.filter((c) => !c.isPaid).length;
            const initials = group.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <div key={group.userId} className="card overflow-hidden animate-fade-in">
                {/* Header */}
                <button
                  onClick={() => toggleExpand(group.userId)}
                  className="w-full flex items-center gap-4 p-4 transition-colors text-left hover:bg-bg-hover"
                >
                  {expanded ? (
                    <ChevronDown className="w-4 h-4 shrink-0 text-text-tertiary" />
                  ) : (
                    <ChevronRight className="w-4 h-4 shrink-0 text-text-tertiary" />
                  )}

                  {/* Avatar */}
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-text-inverted shrink-0"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary truncate">
                        {group.name}
                      </span>
                      {pendingCount > 0 ? (
                        <span className="badge text-[11px] bg-warning-surface text-warning">
                          {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
                        </span>
                      ) : group.commissions.length > 0 ? (
                        <span className="badge text-[11px] bg-success-surface text-success">
                          Tudo pago
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 max-w-[120px] rounded-full h-1.5 bg-bg-hover">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${pctPaid}%`,
                            backgroundColor: pctPaid === 100 ? 'var(--success)' : 'var(--accent)',
                          }}
                        />
                      </div>
                      <span className="text-xs text-text-tertiary">{pctPaid}%</span>
                    </div>
                  </div>

                  <span className="text-base font-bold shrink-0 text-accent">
                    {formatCurrency(group.total)}
                  </span>
                </button>

                {/* Expanded items */}
                {expanded && (
                  <div className="border-t border-border-default">
                    {pendingCount > 0 && (
                      <div className="px-4 py-2 flex justify-end bg-bg-hover">
                        <button
                          onClick={() => onMarkAllPaid(group.userId, month)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors text-accent bg-accent-surface hover:bg-accent-surface-hover"
                        >
                          Pagar todas ({pendingCount})
                        </button>
                      </div>
                    )}
                    {group.commissions.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 px-4 py-3 transition-colors border-b border-border-default last:border-b-0 hover:bg-bg-hover"
                      >
                        {/* Paid toggle */}
                        <button
                          onClick={() =>
                            c.isPaid ? onMarkUnpaid(c.id) : onMarkPaid(c.id)
                          }
                          className={cn(
                            'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                            c.isPaid
                              ? 'border-accent bg-accent'
                              : 'border-border-default bg-transparent hover:border-accent'
                          )}
                        >
                          {c.isPaid && (
                            <Check className="w-3 h-3 text-text-inverted" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'text-sm truncate',
                              c.isPaid
                                ? 'text-text-tertiary line-through'
                                : 'text-text-primary'
                            )}
                          >
                            {c.metric?.caption
                              ? c.metric.caption.slice(0, 60) +
                                (c.metric.caption.length > 60 ? '...' : '')
                              : 'Post sem legenda'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="badge text-[11px] bg-info-surface text-info">
                              {c.metric?.platform || 'N/A'}
                            </span>
                            <span className="text-[11px] text-text-tertiary">
                              {formatNumber(c.metric?.views || 0)} views
                            </span>
                          </div>
                        </div>

                        <span
                          className={cn(
                            'text-sm font-bold shrink-0',
                            c.isPaid ? 'text-text-tertiary' : 'text-text-primary'
                          )}
                        >
                          {formatCurrency(c.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
