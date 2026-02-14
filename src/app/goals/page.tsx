'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Target,
  Plus,
  X,
  Trophy,
  Clock,
  TrendingUp,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useGoalsStore } from '@/stores/goals-store';
import { useToastStore } from '@/stores/toast-store';
import { cn } from '@/lib/utils';
import {
  GOAL_PERIOD_LABELS,
  GOAL_STATUS_LABELS,
} from '@/types';
import type { GoalWithProgress, GoalPeriod, SocialAccount } from '@/types';

// ===== Helpers =====

function formatFollowerCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

function getPlatformColor(platform: string): string {
  switch (platform) {
    case 'instagram': return '#E4405F';
    case 'tiktok': return '#00F2EA';
    default: return 'var(--accent)';
  }
}

function getPlatformLabel(platform: string): string {
  switch (platform) {
    case 'instagram': return 'Instagram';
    case 'tiktok': return 'TikTok';
    default: return platform;
  }
}

function getStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case 'achieved': return { bg: 'var(--success-surface)', text: 'var(--success)' };
    case 'expired': return { bg: 'var(--error-surface)', text: 'var(--error)' };
    default: return { bg: 'var(--accent-surface)', text: 'var(--accent)' };
  }
}

function getEndDateForPeriod(period: string): string {
  const now = new Date();
  switch (period) {
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
    case 'quarterly':
      now.setMonth(now.getMonth() + 3);
      break;
    case 'yearly':
      now.setFullYear(now.getFullYear() + 1);
      break;
    default:
      now.setMonth(now.getMonth() + 1);
  }
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ===== Period Selector for chart =====

const CHART_PERIODS = [
  { label: '30d', days: 30 },
  { label: '60d', days: 60 },
  { label: '90d', days: 90 },
] as const;

// ===== GoalCard Component =====

function GoalCard({
  goal,
  onSelect,
  onDelete,
}: {
  goal: GoalWithProgress;
  onSelect: (accountId: string) => void;
  onDelete: (id: string) => void;
}) {
  const account = goal.socialAccount;
  const statusColors = getStatusColor(goal.status);
  const platformColor = getPlatformColor(account?.platform || '');
  const diff = goal.targetValue - (account?.followersCount || goal.currentValue);

  return (
    <div
      className="card p-5 card-hover cursor-pointer group relative"
      onClick={() => account && onSelect(account.id)}
    >
      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(goal.id); }}
        className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error-surface"
        title="Remover meta"
      >
        <Trash2 size={14} className="text-error" />
      </button>

      {/* Header: Avatar + Platform Badge */}
      <div className="flex items-center gap-3 mb-4">
        {account?.profilePictureUrl ? (
          <img
            src={account.profilePictureUrl}
            alt={account.displayName}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: platformColor }}
          >
            {(account?.displayName || '?')[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            @{account?.username || 'unknown'}
          </p>
          <div className="flex items-center gap-2">
            <span
              className="badge text-[10px] py-0 px-1.5"
              style={{ backgroundColor: `${platformColor}20`, color: platformColor }}
            >
              {getPlatformLabel(account?.platform || '')}
            </span>
            <span
              className="badge text-[10px] py-0 px-1.5"
              style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
            >
              {GOAL_STATUS_LABELS[goal.status as keyof typeof GOAL_STATUS_LABELS] || goal.status}
            </span>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-2xl font-bold text-text-primary">
          {formatFollowerCount(account?.followersCount || goal.currentValue)}
        </span>
        <span className="text-sm text-text-secondary">
          / {formatFollowerCount(goal.targetValue)} seguidores
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full rounded-full bg-bg-hover overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(goal.progress, 100)}%`,
            backgroundColor: goal.status === 'achieved'
              ? 'var(--success)'
              : goal.status === 'expired'
                ? 'var(--error)'
                : 'var(--accent)',
          }}
        />
      </div>

      {/* Footer: Progress % + Days Remaining */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">
          {goal.progress}% completo
          {diff > 0 && goal.status === 'active' && (
            <span className="text-text-tertiary ml-1">
              (faltam {formatFollowerCount(diff)})
            </span>
          )}
        </span>
        {goal.status === 'active' && (
          <span className="text-xs text-text-tertiary flex items-center gap-1">
            <Clock size={10} />
            {goal.daysRemaining}d restantes
          </span>
        )}
        {goal.status === 'achieved' && (
          <span className="text-xs text-success flex items-center gap-1">
            <Trophy size={10} />
            Meta atingida
          </span>
        )}
        {goal.status === 'expired' && (
          <span className="text-xs text-error flex items-center gap-1">
            <AlertCircle size={10} />
            Expirada
          </span>
        )}
      </div>
    </div>
  );
}

// ===== Create Goal Modal =====

function CreateGoalModal({
  accounts,
  onClose,
  onCreate,
}: {
  accounts: SocialAccount[];
  onClose: () => void;
  onCreate: (data: {
    socialAccountId: string;
    targetValue: number;
    period: string;
    endDate: string;
  }) => void;
}) {
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
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
      targetValue: parseInt(targetValue, 10),
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
          background: 'var(--bg-card)',
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

          {/* Metric Type (locked to followers for now) */}
          <div>
            <label className="text-label text-text-secondary block mb-1.5">
              Metrica
            </label>
            <div className="input bg-bg-secondary text-text-secondary cursor-not-allowed">
              Seguidores
            </div>
            <p className="text-[11px] text-text-tertiary mt-1">
              Views e engagement em breve
            </p>
          </div>

          {/* Target Value */}
          <div>
            <label htmlFor="goal-target" className="text-label text-text-secondary block mb-1.5">
              Meta de Seguidores
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
              Periodo
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

// ===== Main Goals Page =====

export default function GoalsPage() {
  const {
    goals,
    progressData,
    loading,
    loadingProgress,
    filterPlatform,
    fetchGoals,
    createGoal,
    deleteGoal,
    fetchProgress,
    setFilterPlatform,
  } = useGoalsStore();

  const { addToast } = useToastStore();

  const [showModal, setShowModal] = useState(false);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [filterAccount, setFilterAccount] = useState('');
  const [chartDays, setChartDays] = useState(90);
  const [selectedChartAccount, setSelectedChartAccount] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Load accounts + goals on mount
  useEffect(() => {
    fetchGoals();

    const loadAccounts = async () => {
      try {
        const res = await fetch('/api/social/accounts');
        if (!res.ok) return;
        const data = (await res.json()) as SocialAccount[];
        setAccounts(data);
      } catch (error) {
        console.error('Failed to load accounts:', error instanceof Error ? error.message : 'Unknown');
      }
    };
    loadAccounts();
  }, [fetchGoals]);

  // Refetch goals when filter changes
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals, filterPlatform]);

  // Load progress when a chart account is selected
  useEffect(() => {
    if (selectedChartAccount) {
      fetchProgress(selectedChartAccount, chartDays);
    }
  }, [selectedChartAccount, chartDays, fetchProgress]);

  // Auto-select first account for chart if none selected
  useEffect(() => {
    if (!selectedChartAccount && goals.length > 0) {
      const firstAccountId = goals[0]?.socialAccount?.id;
      if (firstAccountId) {
        setSelectedChartAccount(firstAccountId);
      }
    }
  }, [goals, selectedChartAccount]);

  // Filtered goals
  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      if (filterPlatform && g.socialAccount?.platform !== filterPlatform) return false;
      if (filterAccount && g.socialAccountId !== filterAccount) return false;
      return true;
    });
  }, [goals, filterPlatform, filterAccount]);

  // Handlers
  const handleCreate = useCallback(async (data: {
    socialAccountId: string;
    targetValue: number;
    period: string;
    endDate: string;
  }) => {
    const success = await createGoal(data);
    if (success) {
      setShowModal(false);
      addToast('Meta criada com sucesso', 'success');
    } else {
      addToast('Erro ao criar meta', 'error');
    }
  }, [createGoal, addToast]);

  const handleDelete = useCallback(async (id: string) => {
    const success = await deleteGoal(id);
    if (success) {
      addToast('Meta removida', 'success');
      setConfirmDelete(null);
    } else {
      addToast('Erro ao remover meta', 'error');
    }
  }, [deleteGoal, addToast]);

  const handleSelectAccount = useCallback((accountId: string) => {
    setSelectedChartAccount(accountId);
  }, []);

  // Stats
  const activeGoals = goals.filter((g) => g.status === 'active').length;
  const achievedGoals = goals.filter((g) => g.status === 'achieved').length;

  // Chart tooltip
  const selectedAccountForChart = accounts.find((a) => a.id === selectedChartAccount);
  const chartTarget = progressData?.targets?.[0];

  // Loading state
  if (loading && goals.length === 0) {
    return (
      <div className="max-w-5xl mx-auto animate-fade-in">
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="skeleton h-4 w-72 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-[200px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target size={24} className="text-accent" />
            <h1 className="text-heading-1 text-text-primary">Metas</h1>
          </div>
          <p className="text-sm text-text-secondary">
            Defina e acompanhe suas metas de seguidores por perfil.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={accounts.length === 0}
          className="btn-accent inline-flex items-center gap-2"
        >
          <Plus size={16} />
          Nova Meta
        </button>
      </div>

      {/* Summary Stats */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-label text-text-tertiary mb-1">Metas Ativas</p>
            <p className="text-2xl font-bold text-text-primary">{activeGoals}</p>
          </div>
          <div className="card p-4">
            <p className="text-label text-text-tertiary mb-1">Atingidas</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-success">{achievedGoals}</p>
              {achievedGoals > 0 && <Trophy size={16} className="text-success" />}
            </div>
          </div>
          <div className="card p-4">
            <p className="text-label text-text-tertiary mb-1">Total</p>
            <p className="text-2xl font-bold text-text-primary">{goals.length}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      {goals.length > 0 && (
        <div className="card p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs font-medium text-text-secondary">Filtrar:</p>
            <select
              value={filterPlatform}
              onChange={(e) => { setFilterPlatform(e.target.value); setFilterAccount(''); }}
              className={cn(
                'input py-1.5 px-3 text-xs w-auto min-w-[140px]',
                filterPlatform && 'border-accent'
              )}
            >
              <option value="">Todas as plataformas</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
            </select>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className={cn(
                'input py-1.5 px-3 text-xs w-auto min-w-[160px]',
                filterAccount && 'border-accent'
              )}
            >
              <option value="">Todos os perfis</option>
              {accounts
                .filter((a) => !filterPlatform || a.platform === filterPlatform)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    @{a.username} ({getPlatformLabel(a.platform)})
                  </option>
                ))}
            </select>
            {(filterPlatform || filterAccount) && (
              <button
                onClick={() => { setFilterPlatform(''); setFilterAccount(''); }}
                className="text-xs text-accent hover:text-accent-hover font-medium transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && !loading && (
        <div className="card p-16 flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-surface mb-4">
            <Target size={28} className="text-accent" />
          </div>
          <h2 className="text-heading-2 text-text-primary mb-2">
            Nenhuma meta criada
          </h2>
          <p className="text-sm text-text-secondary max-w-md mb-6">
            {accounts.length === 0
              ? 'Conecte suas contas sociais primeiro para poder definir metas de seguidores.'
              : 'Crie sua primeira meta de seguidores para acompanhar o crescimento dos seus perfis.'
            }
          </p>
          {accounts.length === 0 ? (
            <a href="/social" className="btn-accent inline-flex items-center gap-2">
              Conectar Contas
            </a>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="btn-accent inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Criar Meta
            </button>
          )}
        </div>
      )}

      {/* Goal Cards Grid */}
      {filteredGoals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 stagger-children">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onSelect={handleSelectAccount}
              onDelete={(id) => setConfirmDelete(id)}
            />
          ))}
        </div>
      )}

      {/* Evolution Chart */}
      {goals.length > 0 && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-accent" />
              <h2 className="text-heading-3 text-text-primary">Evolucao de Seguidores</h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Account selector for chart */}
              <select
                value={selectedChartAccount}
                onChange={(e) => setSelectedChartAccount(e.target.value)}
                className="input py-1.5 px-3 text-xs w-auto min-w-[160px]"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    @{a.username} ({getPlatformLabel(a.platform)})
                  </option>
                ))}
              </select>
              {/* Period selector */}
              <div className="flex gap-1">
                {CHART_PERIODS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setChartDays(p.days)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                      chartDays === p.days
                        ? 'bg-accent text-text-inverted'
                        : 'bg-bg-hover text-text-secondary hover:text-text-primary'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          {loadingProgress ? (
            <div className="skeleton h-[300px]" />
          ) : progressData && progressData.series.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={progressData.series}
                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickFormatter={(v: string) => {
                    const parts = v.split('-');
                    return `${parts[2]}/${parts[1]}`;
                  }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => formatFollowerCount(v)}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                    fontSize: 12,
                  }}
                  labelFormatter={(v) => {
                    const d = new Date(String(v));
                    return d.toLocaleDateString('pt-BR');
                  }}
                  formatter={(value) => [
                    formatFollowerCount(Number(value)),
                    'Seguidores',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="followers"
                  stroke={selectedAccountForChart
                    ? getPlatformColor(selectedAccountForChart.platform)
                    : 'var(--accent)'}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                {/* Target reference line */}
                {chartTarget && (
                  <ReferenceLine
                    y={chartTarget.targetValue}
                    stroke="var(--warning)"
                    strokeDasharray="6 4"
                    label={{
                      value: `Meta: ${formatFollowerCount(chartTarget.targetValue)}`,
                      position: 'right',
                      fill: 'var(--warning)',
                      fontSize: 11,
                    }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
              <TrendingUp size={32} className="mb-3 opacity-40" />
              <p className="text-sm font-medium">Sem dados historicos</p>
              <p className="text-xs mt-1">
                Os snapshots diarios vao aparecer aqui conforme forem registrados.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <CreateGoalModal
          accounts={accounts}
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-backdrop"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-sm mx-4 p-6 animate-scale-in"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-error-surface">
                <Trash2 size={18} className="text-error" />
              </div>
              <div>
                <h3 className="text-heading-3 text-text-primary">Remover Meta</h3>
                <p className="text-xs text-text-secondary">Essa acao nao pode ser desfeita</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn-ghost flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: 'var(--error)',
                  color: 'white',
                }}
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
