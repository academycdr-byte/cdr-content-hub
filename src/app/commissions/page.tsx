'use client';

import { useEffect, useCallback, useState } from 'react';
import { DollarSign, Settings } from 'lucide-react';
import { useCommissionsStore } from '@/stores/commissions-store';
import CommissionSummary from '@/components/commissions/commission-summary';
import CommissionByUser from '@/components/commissions/commission-by-user';
import MonthSelector from '@/components/commissions/month-selector';
import CpmConfig from '@/components/commissions/cpm-config';
import { cn } from '@/lib/utils';

type Tab = 'commissions' | 'settings';

export default function CommissionsPage() {
  const {
    commissions,
    configs,
    loading,
    loadingConfigs,
    month,
    stats,
    fetchCommissions,
    fetchConfigs,
    calculateMonth,
    markPaid,
    markUnpaid,
    markAllPaid,
    updateConfig,
    setMonth,
  } = useCommissionsStore();

  const [activeTab, setActiveTab] = useState<Tab>('commissions');

  const loadData = useCallback(() => {
    fetchCommissions();
    fetchConfigs();
  }, [fetchCommissions, fetchConfigs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMonthChange = useCallback(
    (newMonth: string) => {
      setMonth(newMonth);
      setTimeout(() => {
        fetchCommissions(newMonth);
      }, 0);
    },
    [setMonth, fetchCommissions]
  );

  const hasData = commissions.length > 0;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={24} className="text-accent" />
              <h1 className="text-heading-1 text-text-primary">Comissoes</h1>
            </div>
            <p className="text-sm text-text-secondary">
              Gerencie as comissoes da equipe baseadas em CPM.
            </p>
          </div>
        </div>

        {/* Month selector & Calculate */}
        <MonthSelector
          month={month}
          loading={loading}
          onMonthChange={handleMonthChange}
          onCalculate={calculateMonth}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-xl bg-bg-hover w-fit">
        <button
          onClick={() => setActiveTab('commissions')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'commissions'
              ? 'bg-bg-card text-text-primary'
              : 'text-text-secondary hover:text-text-primary'
          )}
          style={
            activeTab === 'commissions'
              ? { boxShadow: 'var(--shadow-sm)' }
              : undefined
          }
        >
          <DollarSign size={16} />
          Comissoes
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'settings'
              ? 'bg-bg-card text-text-primary'
              : 'text-text-secondary hover:text-text-primary'
          )}
          style={
            activeTab === 'settings'
              ? { boxShadow: 'var(--shadow-sm)' }
              : undefined
          }
        >
          <Settings size={16} />
          Configuracao CPM
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'commissions' ? (
        <>
          {/* Summary */}
          <div className="mb-6">
            <CommissionSummary stats={stats} loading={loading} />
          </div>

          {/* Commission by User */}
          {!loading && !hasData ? (
            <div className="card p-16 flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-surface mb-4">
                <DollarSign size={28} className="text-accent" />
              </div>
              <h2 className="text-heading-2 text-text-primary mb-2">
                Nenhuma comissao para este mes
              </h2>
              <p className="text-sm text-text-secondary max-w-md mb-2">
                Sincronize posts com metricas e clique em &quot;Calcular&quot; para
                gerar as comissoes do mes selecionado.
              </p>
            </div>
          ) : (
            <CommissionByUser
              commissions={commissions}
              loading={loading}
              month={month}
              onMarkPaid={markPaid}
              onMarkUnpaid={markUnpaid}
              onMarkAllPaid={markAllPaid}
            />
          )}
        </>
      ) : (
        <CpmConfig
          configs={configs}
          loading={loadingConfigs}
          onUpdateConfig={updateConfig}
        />
      )}
    </div>
  );
}
