'use client';

import { useState } from 'react';
import { Play, Layers, Image, CircleDot, Calculator, Save } from 'lucide-react';
import type { CommissionConfig } from '@/types';

interface CpmConfigProps {
  configs: CommissionConfig[];
  loading: boolean;
  onUpdateConfig: (format: string, cpmValue: number) => Promise<void>;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

const FORMAT_META: Record<
  string,
  { label: string; icon: typeof Play; color: string; bgColor: string }
> = {
  REEL: {
    label: 'Reel',
    icon: Play,
    color: 'var(--error)',
    bgColor: 'var(--error-surface)',
  },
  CAROUSEL: {
    label: 'Carrossel',
    icon: Layers,
    color: 'var(--info)',
    bgColor: 'var(--info-surface)',
  },
  STATIC: {
    label: 'Post',
    icon: Image,
    color: 'var(--success)',
    bgColor: 'var(--success-surface)',
  },
  STORY: {
    label: 'Story',
    icon: CircleDot,
    color: 'var(--warning)',
    bgColor: 'var(--warning-surface)',
  },
};

export default function CpmConfig({
  configs,
  loading,
  onUpdateConfig,
}: CpmConfigProps) {
  const [localValues, setLocalValues] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [simFormat, setSimFormat] = useState('REEL');
  const [simViews, setSimViews] = useState(10000);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-[60px]" />
        ))}
      </div>
    );
  }

  const getValue = (format: string): number => {
    if (localValues[format] !== undefined) return localValues[format];
    const config = configs.find((c) => c.format === format);
    return config?.cpmValue || 0;
  };

  const handleChange = (format: string, value: number) => {
    setLocalValues((prev) => ({ ...prev, [format]: value }));
  };

  const handleSave = async (format: string) => {
    const value = getValue(format);
    setSaving((prev) => ({ ...prev, [format]: true }));
    await onUpdateConfig(format, value);
    setLocalValues((prev) => {
      const next = { ...prev };
      delete next[format];
      return next;
    });
    setSaving((prev) => ({ ...prev, [format]: false }));
  };

  const isChanged = (format: string): boolean => {
    return localValues[format] !== undefined;
  };

  // Simulator
  const simCPM = getValue(simFormat);
  const simComissao = (simViews / 1000) * simCPM;

  return (
    <div className="space-y-6">
      {/* CPM Values */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'var(--accent-surface)' }}
          >
            <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
              $
            </span>
          </div>
          <h3 className="text-heading-3 text-text-primary">Valores de CPM por Formato</h3>
        </div>

        <div className="space-y-5">
          {configs.map((config) => {
            const meta = FORMAT_META[config.format] || FORMAT_META['STATIC'];
            const Icon = meta.icon;
            const value = getValue(config.format);
            const changed = isChanged(config.format);
            const isSaving = saving[config.format] || false;

            return (
              <div key={config.format} className="flex items-center gap-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                  style={{ backgroundColor: meta.bgColor }}
                >
                  <Icon size={18} style={{ color: meta.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-text-primary">
                      {meta.label}
                    </span>
                    <span className="text-sm font-bold text-accent">
                      {formatCurrency(value)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="0.5"
                    value={value}
                    onChange={(e) =>
                      handleChange(config.format, parseFloat(e.target.value))
                    }
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, var(--accent) ${(value / 50) * 100}%, var(--bg-hover) ${(value / 50) * 100}%)`,
                    }}
                  />
                </div>

                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={value}
                  onChange={(e) =>
                    handleChange(config.format, parseFloat(e.target.value) || 0)
                  }
                  className="input w-20 text-center !py-1.5 !text-sm"
                />

                {changed && (
                  <button
                    onClick={() => handleSave(config.format)}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-accent bg-accent-surface hover:bg-accent-surface-hover disabled:opacity-50"
                  >
                    <Save size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulator */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'var(--info-surface)' }}
          >
            <Calculator size={16} style={{ color: 'var(--info)' }} />
          </div>
          <h3 className="text-heading-3 text-text-primary">Simulador de Comissao</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label
              htmlFor="sim-format"
              className="text-xs font-medium text-text-secondary mb-1.5 block"
            >
              Formato
            </label>
            <select
              id="sim-format"
              value={simFormat}
              onChange={(e) => setSimFormat(e.target.value)}
              className="input"
            >
              {configs.map((c) => (
                <option key={c.format} value={c.format}>
                  {FORMAT_META[c.format]?.label || c.format}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="sim-views"
              className="text-xs font-medium text-text-secondary mb-1.5 block"
            >
              Visualizacoes
            </label>
            <input
              id="sim-views"
              type="number"
              min={0}
              step={1000}
              value={simViews}
              onChange={(e) => setSimViews(parseInt(e.target.value, 10) || 0)}
              className="input"
            />
          </div>
        </div>

        <div
          className="rounded-xl p-5 text-center"
          style={{
            backgroundColor: 'var(--accent-surface)',
            border: '1px solid var(--accent)',
          }}
        >
          <p className="text-sm font-medium text-text-secondary">Comissao estimada</p>
          <p className="text-3xl font-bold mt-1 text-accent">
            {formatCurrency(simComissao)}
          </p>
          <p className="text-xs mt-2 text-text-tertiary">
            {formatNumber(simViews)} views x {formatCurrency(simCPM)} CPM ={' '}
            {formatCurrency(simComissao)}
          </p>
        </div>
      </div>
    </div>
  );
}
