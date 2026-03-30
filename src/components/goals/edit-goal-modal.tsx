'use client';

import { useState, useCallback, useEffect } from 'react';
import { Target, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GOAL_PERIOD_LABELS, GOAL_METRIC_TYPES, GOAL_METRIC_UNITS } from '@/types';
import type { GoalPeriod, GoalMetricType, GoalWithProgress } from '@/types';
import { formatFollowerCount, getEndDateForPeriod } from './helpers';

interface EditGoalModalProps {
  goal: GoalWithProgress;
  onClose: () => void;
  onUpdate: (id: string, data: {
    targetValue?: number;
    period?: string;
    endDate?: string;
  }) => void;
}

export function EditGoalModal({ goal, onClose, onUpdate }: EditGoalModalProps) {
  const [targetValue, setTargetValue] = useState(String(goal.targetValue));
  const [period, setPeriod] = useState<GoalPeriod>(goal.period as GoalPeriod);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(goal.endDate);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [submitting, setSubmitting] = useState(false);

  const metricType = goal.metricType as GoalMetricType;
  const account = goal.socialAccount;

  const handlePeriodChange = useCallback((newPeriod: GoalPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      setEndDate(getEndDateForPeriod(newPeriod));
    }
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const input = document.getElementById('edit-goal-target');
      input?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetValue || !endDate) return;

    setSubmitting(true);
    onUpdate(goal.id, {
      targetValue: parseFloat(targetValue),
      period,
      endDate,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-backdrop"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md mx-4 animate-scale-in"
        style={{
          background: 'var(--bg-modal)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-accent" />
            <h2 className="text-heading-3 text-text-primary">Editar Meta</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors"
          >
            <X size={16} className="text-text-tertiary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Account (read-only) */}
          <div>
            <label className="text-label text-text-secondary block mb-1.5">
              Perfil
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-hover">
              {account?.profilePictureUrl && (
                <img src={account.profilePictureUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
              )}
              <span className="text-sm text-text-primary">
                @{account?.username || 'desconhecido'}
              </span>
              <span className="text-xs text-text-tertiary ml-auto">
                {formatFollowerCount(account?.followersCount || goal.currentValue)} seguidores
              </span>
            </div>
          </div>

          {/* Metric (read-only) */}
          <div>
            <label className="text-label text-text-secondary block mb-1.5">
              Métrica
            </label>
            <div className="px-3 py-2 rounded-lg bg-bg-hover">
              <span className="text-sm text-text-primary">
                {GOAL_METRIC_TYPES[metricType] || metricType}
              </span>
            </div>
          </div>

          {/* Target Value */}
          <div>
            <label htmlFor="edit-goal-target" className="text-label text-text-secondary block mb-1.5">
              Meta {GOAL_METRIC_UNITS[metricType] ? `(${GOAL_METRIC_UNITS[metricType]})` : ''}
            </label>
            <input
              id="edit-goal-target"
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="Ex: 10000"
              className="input"
              min={1}
              required
            />
          </div>

          {/* Period */}
          <div>
            <label className="text-label text-text-secondary block mb-1.5">
              Período
            </label>
            <div className="flex gap-2">
              {(Object.entries(GOAL_PERIOD_LABELS) as [GoalPeriod, string][]).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePeriodChange(key)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1',
                    period === key
                      ? 'bg-accent text-text-inverted'
                      : 'bg-bg-hover text-text-secondary hover:text-text-primary'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="edit-goal-end-date" className="text-label text-text-secondary block mb-1.5">
              Data Final
            </label>
            <input
              id="edit-goal-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
              min={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })()}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !targetValue || !endDate}
              className="btn-accent flex-1 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div
                  className="h-4 w-4 rounded-full border-2 border-t-transparent"
                  style={{
                    borderColor: 'var(--text-inverted)',
                    borderTopColor: 'transparent',
                    animation: 'spin 0.6s linear infinite',
                  }}
                />
              ) : (
                <>
                  <Save size={14} />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
