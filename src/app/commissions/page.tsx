'use client';

import { useEffect, useState, useCallback } from 'react';
import { DollarSign, Save, Info, Film, Images, Image, Clapperboard, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/stores/toast-store';
import type { ContentPillar, SocialAccount } from '@/types';

interface CpmConfig {
  id: string;
  format: string;
  cpmValue: number;
  updatedAt: string;
}

const FORMAT_META: Record<string, { label: string; description: string; icon: React.ReactNode; color: string }> = {
  REEL: {
    label: 'Reels / Video',
    description: 'Vídeos curtos (Reels, TikTok)',
    icon: <Film size={20} />,
    color: 'var(--error)',
  },
  CAROUSEL: {
    label: 'Carrossel',
    description: 'Posts com múltiplas imagens',
    icon: <Images size={20} />,
    color: 'var(--pillar-education)',
  },
  STATIC: {
    label: 'Imagem Estática',
    description: 'Post com imagem única',
    icon: <Image size={20} />,
    color: 'var(--pillar-cases)',
  },
  STORY: {
    label: 'Story',
    description: 'Stories temporários (24h)',
    icon: <Clapperboard size={20} />,
    color: 'var(--warning)',
  },
};

export default function CommissionsPage() {
  const [configs, setConfigs] = useState<CpmConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  // Pilares state
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [pillarsSaving, setPillarsSaving] = useState(false);
  const { addToast } = useToastStore();

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/commissions/configs');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json() as CpmConfig[];
      setConfigs(data);
      const values: Record<string, string> = {};
      for (const c of data) {
        values[c.format] = String(c.cpmValue);
      }
      setEditValues(values);
    } catch (error) {
      console.error('Failed to fetch configs:', error instanceof Error ? error.message : 'Unknown');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
    fetchAccounts();
  }, [fetchConfigs]);

  // Pilares
  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/social/accounts');
      if (!res.ok) return;
      const data = await res.json() as SocialAccount[];
      setAccounts(data);
      if (data.length > 0) {
        setSelectedAccountId(data[0].id);
      }
    } catch { /* ignore */ }
  };

  const fetchPillars = useCallback(async (accountId?: string) => {
    try {
      const url = accountId ? `/api/pillars?accountId=${accountId}` : '/api/pillars';
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json() as ContentPillar[];
      setPillars(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (selectedAccountId) fetchPillars(selectedAccountId);
    else fetchPillars();
  }, [selectedAccountId, fetchPillars]);

  function updatePillar(index: number, field: keyof ContentPillar, value: unknown) {
    setPillars((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  const totalPercentage = pillars.reduce((sum, p) => sum + p.targetPercentage, 0);
  const isPillarsValid = totalPercentage === 100;

  async function handleSavePillars() {
    if (!isPillarsValid) {
      addToast('A soma dos percentuais deve ser 100%', 'error');
      return;
    }
    setPillarsSaving(true);
    try {
      const res = await fetch('/api/pillars', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pillars),
      });
      if (!res.ok) throw new Error('Failed to save');
      addToast('Pilares atualizados!', 'success');
    } catch {
      addToast('Erro ao salvar pilares', 'error');
    } finally {
      setPillarsSaving(false);
    }
  }

  const handleSave = async (format: string) => {
    const value = parseFloat(editValues[format]);
    if (isNaN(value) || value < 0) return;

    setSaving(format);
    try {
      const res = await fetch('/api/commissions/configs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, cpmValue: value }),
      });

      if (!res.ok) throw new Error('Failed to save');

      const updated = await res.json() as CpmConfig;
      setConfigs((prev) => prev.map((c) => (c.format === format ? updated : c)));
      setSaved(format);
      setTimeout(() => setSaved(null), 2000);
    } catch (error) {
      console.error('Failed to save config:', error instanceof Error ? error.message : 'Unknown');
    } finally {
      setSaving(null);
    }
  };

  const hasChanged = (format: string): boolean => {
    const config = configs.find((c) => c.format === format);
    if (!config) return false;
    const editVal = parseFloat(editValues[format]);
    return !isNaN(editVal) && editVal !== config.cpmValue;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="skeleton h-4 w-72 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-[180px]" />
          ))}
        </div>
      </div>
    );
  }

  // Example calculation
  const exampleViews = 10000;
  const exampleFormat = configs.find((c) => c.format === 'REEL');
  const exampleValue = exampleFormat
    ? (exampleViews / 1000) * exampleFormat.cpmValue
    : 20;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[24px] sm:text-[30px] font-bold leading-tight text-text-primary">Comissões</h1>
        <p className="text-sm text-text-tertiary mt-1">
          Configure o valor CPM (custo por mil views) de cada formato de conteúdo.
        </p>
      </div>

      {/* How it works */}
      <div className="card p-6 mb-6 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-surface">
          <Info size={16} className="text-accent" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary mb-1">Como funciona o cálculo</p>
          <p className="text-sm text-text-secondary">
            O valor estimado de cada post é calculado como: <span className="font-mono text-text-primary">views / 1.000 x CPM</span>
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            Exemplo: {exampleViews.toLocaleString('pt-BR')} views em um Reel com CPM de R$ {exampleFormat?.cpmValue.toFixed(2).replace('.', ',') || '2,00'} = <span className="font-semibold text-accent">R$ {exampleValue.toFixed(2).replace('.', ',')}</span>
          </p>
        </div>
      </div>

      {/* CPM Config Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {configs.map((config) => {
          const meta = FORMAT_META[config.format];
          const changed = hasChanged(config.format);
          const isSaving = saving === config.format;
          const isSaved = saved === config.format;

          return (
            <div key={config.format} className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-surface text-accent"
                >
                  {meta?.icon || <DollarSign size={20} />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {meta?.label || config.format}
                  </p>
                  <p className="text-[11px] text-text-tertiary">
                    {meta?.description || config.format}
                  </p>
                </div>
              </div>

              {/* CPM Input */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[11px] text-text-tertiary mb-1 block">
                    Valor CPM (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-text-tertiary">R$</span>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      value={editValues[config.format] || ''}
                      onChange={(e) =>
                        setEditValues((prev) => ({ ...prev, [config.format]: e.target.value }))
                      }
                      className="input pl-11 text-lg font-bold"
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => handleSave(config.format)}
                    disabled={!changed || isSaving}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg transition-all',
                      changed && !isSaving
                        ? 'bg-accent text-text-inverted hover:opacity-90'
                        : isSaved
                          ? 'bg-success text-white'
                          : 'bg-bg-hover text-text-tertiary cursor-not-allowed'
                    )}
                  >
                    {isSaving ? (
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-3 pt-3 border-t border-border-default">
                <p className="text-[11px] text-text-tertiary">
                  10K views = <span className="font-semibold text-text-primary">R$ {((10000 / 1000) * (parseFloat(editValues[config.format]) || config.cpmValue)).toFixed(2).replace('.', ',')}</span>
                  {' | '}
                  100K views = <span className="font-semibold text-text-primary">R$ {((100000 / 1000) * (parseFloat(editValues[config.format]) || config.cpmValue)).toFixed(2).replace('.', ',')}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== PILARES DE CONTEÚDO (inline) ===== */}
      <div className="mt-10 pt-8 border-t border-border-default">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-[20px] sm:text-[24px] font-bold text-text-primary">Pilares de Conteúdo</h2>
            <p className="text-sm text-text-tertiary mt-1">
              Distribuição percentual do seu mix de conteúdo.
            </p>
          </div>
          <button
            onClick={handleSavePillars}
            disabled={pillarsSaving || !isPillarsValid}
            className="btn-accent flex items-center gap-2"
          >
            {pillarsSaving ? (
              <><Loader2 size={16} className="animate-spin" /> Salvando...</>
            ) : (
              <><Save size={16} /> Salvar Pilares</>
            )}
          </button>
        </div>

        {/* Account Selector */}
        {accounts.length > 1 && (
          <div className="mb-4">
            <label className="text-label text-text-tertiary mb-2 block">Perfil</label>
            <div className="flex flex-wrap gap-2">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={cn(
                    'rounded-[10px] border px-4 py-2 text-sm font-medium transition-all',
                    selectedAccountId === acc.id
                      ? 'border-accent bg-accent-surface text-accent'
                      : 'border-border-default bg-bg-primary text-text-secondary hover:border-border-strong'
                  )}
                >
                  {acc.platform === 'instagram' ? 'IG' : 'TT'} @{acc.username}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Percentage Total */}
        <div
          className={cn(
            'card p-4 mb-4 flex items-center gap-3',
            isPillarsValid ? 'border-success bg-success-surface' : 'border-error bg-error-surface'
          )}
        >
          {!isPillarsValid && <AlertCircle size={18} className="text-error shrink-0" />}
          <p className={cn('text-sm font-medium', isPillarsValid ? 'text-success' : 'text-error')}>
            Total: {totalPercentage}%{!isPillarsValid && ' - A soma deve ser exatamente 100%'}
          </p>
        </div>

        {/* Pillar List */}
        <div className="space-y-3">
          {pillars.map((pillar, index) => (
            <div key={pillar.id} className="card p-5">
              <div className="flex items-start gap-3">
                <input
                  type="color"
                  value={pillar.color}
                  onChange={(e) => updatePillar(index, 'color', e.target.value)}
                  className="h-9 w-9 cursor-pointer rounded-lg border border-border-default shrink-0 mt-0.5"
                  style={{ padding: 2 }}
                />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-label text-text-tertiary mb-1 block">Nome</label>
                      <input
                        type="text"
                        value={pillar.name}
                        onChange={(e) => updatePillar(index, 'name', e.target.value)}
                        className="input py-2 text-sm"
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-label text-text-tertiary mb-1 block">Meta %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={pillar.targetPercentage}
                        onChange={(e) => updatePillar(index, 'targetPercentage', parseInt(e.target.value) || 0)}
                        className="input py-2 text-sm text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 h-1.5 w-full rounded-full bg-bg-hover overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${pillar.targetPercentage}%`, backgroundColor: pillar.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
