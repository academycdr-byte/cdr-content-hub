'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Target,
  Plus,
  TrendingUp,
  Trash2,
  Trophy,
  Camera,
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
import type { SocialAccount } from '@/types';

import dynamic from 'next/dynamic';
import { GoalCard } from '@/components/goals/goal-card';
import { formatFollowerCount, getPlatformColor, getPlatformLabel } from '@/components/goals/helpers';

const CreateGoalModal = dynamic(() => import('@/components/goals/create-goal-modal').then(m => ({ default: m.CreateGoalModal })), { ssr: false });

// ===== Period Selector for chart =====

const CHART_PERIODS = [
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '180d', days: 180 },
  { label: '1 ano', days: 365 },
] as const;

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
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  // Manual snapshot trigger
  const handleSnapshot = useCallback(async () => {
    setSnapshotLoading(true);
    try {
      const res = await fetch('/api/goals/snapshot', { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      addToast('Snapshot registrado com sucesso', 'success');
      // Refresh chart data
      if (selectedChartAccount) {
        fetchProgress(selectedChartAccount, chartDays);
      }
    } catch {
      addToast('Erro ao registrar snapshot', 'error');
    } finally {
      setSnapshotLoading(false);
    }
  }, [addToast, selectedChartAccount, chartDays, fetchProgress]);

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
    if (!selectedChartAccount && accounts.length > 0) {
      setSelectedChartAccount(accounts[0].id);
    }
  }, [accounts, selectedChartAccount]);

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
    metricType: string;
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
            Defina e acompanhe suas metas por perfil.
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

      {/* Evolution Chart - always visible when accounts exist */}
      {accounts.length > 0 && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-accent" />
              <h2 className="text-heading-3 text-text-primary">Evolução de Seguidores</h2>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
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
              {/* Manual snapshot button */}
              <button
                onClick={handleSnapshot}
                disabled={snapshotLoading}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors bg-bg-hover text-text-secondary hover:text-text-primary hover:bg-accent-surface"
                title="Registrar snapshot de seguidores agora"
              >
                <Camera size={12} />
                {snapshotLoading ? 'Salvando...' : 'Snapshot'}
              </button>
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
              <p className="text-sm font-medium">Sem dados históricos</p>
              <p className="text-xs mt-1 mb-4">
                Registre o primeiro snapshot para começar a acompanhar a evolução.
              </p>
              <button
                onClick={handleSnapshot}
                disabled={snapshotLoading}
                className="btn-accent inline-flex items-center gap-2 text-sm"
              >
                <Camera size={14} />
                {snapshotLoading ? 'Registrando...' : 'Registrar Snapshot Agora'}
              </button>
            </div>
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
              background: 'var(--bg-modal)',
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
                <p className="text-xs text-text-secondary">Essa ação não pode ser desfeita</p>
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
