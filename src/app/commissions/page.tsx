'use client';

import { useEffect, useState, useCallback } from 'react';
import { DollarSign, Save, Info, Film, Images, Image, Clapperboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CpmConfig {
  id: string;
  format: string;
  cpmValue: number;
  updatedAt: string;
}

const FORMAT_META: Record<string, { label: string; description: string; icon: React.ReactNode; color: string }> = {
  REEL: {
    label: 'Reels / Video',
    description: 'Videos curtos (Reels, TikTok)',
    icon: <Film size={20} />,
    color: '#E4405F',
  },
  CAROUSEL: {
    label: 'Carrossel',
    description: 'Posts com multiplas imagens',
    icon: <Images size={20} />,
    color: '#7C3AED',
  },
  STATIC: {
    label: 'Imagem Estatica',
    description: 'Post com imagem unica',
    icon: <Image size={20} />,
    color: '#2563EB',
  },
  STORY: {
    label: 'Story',
    description: 'Stories temporarios (24h)',
    icon: <Clapperboard size={20} />,
    color: '#D97706',
  },
};

export default function CommissionsPage() {
  const [configs, setConfigs] = useState<CpmConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

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
  }, [fetchConfigs]);

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
        <h1 className="text-display text-text-primary">Comissoes</h1>
        <p className="mt-2 text-text-secondary">
          Configure o valor CPM (custo por mil views) de cada formato de conteudo.
        </p>
      </div>

      {/* How it works */}
      <div className="card p-5 mb-6 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-surface">
          <Info size={16} className="text-accent" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary mb-1">Como funciona o calculo</p>
          <p className="text-sm text-text-secondary">
            O valor estimado de cada post e calculado como: <span className="font-mono text-text-primary">views / 1.000 x CPM</span>
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
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${meta?.color || '#6E6E73'}15`, color: meta?.color || '#6E6E73' }}
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
    </div>
  );
}
