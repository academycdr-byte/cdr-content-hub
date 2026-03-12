'use client';

import { useState, useCallback, useEffect } from 'react';
import { Target, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GOAL_PERIOD_LABELS, GOAL_METRIC_TYPES, GOAL_METRIC_UNITS } from '@/types';
import type { GoalPeriod, GoalMetricType, SocialAccount } from '@/types';
import { formatFollowerCount, getPlatformLabel, getEndDateForPeriod } from './helpers';

interface CreateGoalModalProps {
  accounts: SocialAccount[];
  onClose: () => void;
  onCreate: (data: {
    socialAccountId: string;
    metricType: string;
    targetValue: number;
    period: string;
    endDate: string;
  }) => void;
}

export function CreateGoalModal({ accounts, onClose, onCreate }: CreateGoalModalProps) {
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [metricType, setMetricType] = useState<GoalMetricType>('followers');
  const [targetValue, setTargetValue] = useState('');
  const [period, setPeriod] = useState<GoalPeriod>('monthly');
  const [endDate, setEndDate] = useState(() => getEndDateForPeriod('monthly'));
  const [submitting, setSubmitting] = useState(false);

  // Update endDate when period changes
  const handlePeriodChange = useCallback((newPeriod: GoalPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      setEndDate(getEndDateForPeriod(newPeriod));
    }
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Focus trap (basic: focus first input on mount)
  useEffect(() => {
    const timer = setTimeout(() => {
      const firstInput = document.getElementById('goal-account-select');
      firstInput?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !targetValue || !endDate) return;

    setSubmitting(true);
    onCreate({
      socialAccountId: selectedAccountId,
      metricType,
      targetValue: parseFloat(targetValue),
      period,
      endDate,
    });
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

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
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-accent" />
            <h2 className="text-heading-3 text-text-primary">Nova Meta</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors"
          >
            <X size={16} className="text-text-secondary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Account Select */}
          <div>
            <label htmlFor="goal-account-select" className="text-label text-text-secondary block mb-1.5">
              Perfil
            </label>
            <select
              id="goal-account-select"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="input"
              required
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  @{a.username} ({getPlatformLabel(a.platform)}) - {formatFollowerCount(a.followersCount)} seguidores
                </option>
              ))}
            </select>
            {selectedAccount && (
              <p className="text-[11px] text-text-tertiary mt-1">
                Atualmente com {formatFollowerCount(selectedAccount.followersCount)} seguidores
              </p>
            )}
          </div>

          {/* Metric Type */}
          <div>
            <label htmlFor="goal-metric-type" className="text-label text-text-secondary block mb-1.5">
              Métrica
            </label>
            <select
              id="goal-metric-type"
              value={metricType}
              onChange={(e) => setMetricType(e.target.value as GoalMetricType)}
              className="input"
            >
              {(Object.entries(GOAL_METRIC_TYPES) as [GoalMetricType, string][]).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Target Value */}
          <div>
            <label htmlFor="goal-target" className="text-label text-text-secondary block mb-1.5">
              Meta {GOAL_METRIC_UNITS[metricType] ? `(${GOAL_METRIC_UNITS[metricType]})` : ''}
            </label>
            <input
              id="goal-target"
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
            <label htmlFor="goal-end-date" className="text-label text-text-secondary block mb-1.5">
              Data Final
            </label>
            <input
              id="goal-end-date"
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
              disabled={submitting || !selectedAccountId || !targetValue || !endDate}
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
                  <Plus size={14} />
                  Criar Meta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
