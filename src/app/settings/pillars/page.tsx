'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/stores/toast-store';
import type { ContentPillar } from '@/types';

export default function PillarsSettingsPage() {
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToastStore();

  useEffect(() => {
    fetchPillars();
  }, []);

  async function fetchPillars() {
    try {
      const res = await fetch('/api/pillars');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json() as ContentPillar[];
      setPillars(data);
    } catch {
      addToast('Erro ao carregar pilares', 'error');
    } finally {
      setLoading(false);
    }
  }

  function updatePillar(index: number, field: keyof ContentPillar, value: unknown) {
    setPillars((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  const totalPercentage = pillars.reduce((sum, p) => sum + p.targetPercentage, 0);
  const isValid = totalPercentage === 100;

  async function handleSave() {
    if (!isValid) {
      addToast('A soma dos percentuais deve ser 100%', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/pillars', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pillars),
      });

      if (!res.ok) {
        const errorData = await res.json() as { error: string };
        throw new Error(errorData.error || 'Failed to save');
      }

      addToast('Pilares atualizados com sucesso!', 'success');
    } catch (error) {
      addToast(
        `Erro ao salvar: ${error instanceof Error ? error.message : 'Unknown'}`,
        'error'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading-1 text-text-primary">Pilares de Conteudo</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Configure os pilares e a distribuicao percentual do seu mix de conteudo.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !isValid}
          className="btn-accent flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save size={16} />
              Salvar
            </>
          )}
        </button>
      </div>

      {/* Percentage Total */}
      <div
        className={cn(
          'card p-4 mb-6 flex items-center gap-3',
          isValid ? 'border-success bg-success-surface' : 'border-error bg-error-surface'
        )}
      >
        {!isValid && <AlertCircle size={18} className="text-error shrink-0" />}
        <p className={cn('text-sm font-medium', isValid ? 'text-success' : 'text-error')}>
          Total: {totalPercentage}%
          {!isValid && ' - A soma deve ser exatamente 100%'}
        </p>
      </div>

      {/* Pillar List */}
      <div className="space-y-4">
        {pillars.map((pillar, index) => (
          <div key={pillar.id} className="card p-6">
            <div className="flex items-start gap-4">
              {/* Color Picker */}
              <div className="pt-1">
                <input
                  type="color"
                  value={pillar.color}
                  onChange={(e) => updatePillar(index, 'color', e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-border-default"
                  style={{ padding: 2 }}
                />
              </div>

              {/* Fields */}
              <div className="flex-1 space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-label text-text-tertiary mb-1 block">Nome</label>
                    <input
                      type="text"
                      value={pillar.name}
                      onChange={(e) => updatePillar(index, 'name', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div className="w-28">
                    <label className="text-label text-text-tertiary mb-1 block">
                      Meta (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={pillar.targetPercentage}
                      onChange={(e) =>
                        updatePillar(index, 'targetPercentage', parseInt(e.target.value) || 0)
                      }
                      className="input text-center"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-label text-text-tertiary mb-1 block">Descricao</label>
                  <input
                    type="text"
                    value={pillar.description}
                    onChange={(e) => updatePillar(index, 'description', e.target.value)}
                    className="input"
                    placeholder="Descricao do pilar..."
                  />
                </div>
              </div>
            </div>

            {/* Visual Bar */}
            <div className="mt-4 h-2 w-full rounded-full bg-bg-hover overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${pillar.targetPercentage}%`,
                  backgroundColor: pillar.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Settings Navigation */}
      <div className="mt-8 pt-6 border-t border-border-default">
        <p className="text-label text-text-tertiary mb-3">Configuracoes</p>
        <div className="flex gap-3">
          <span className="badge bg-accent-surface text-accent">
            Pilares de Conteudo
          </span>
          <a
            href="/settings/checklists"
            className="badge bg-bg-secondary text-text-secondary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            Checklists
          </a>
          <a
            href="/settings/appearance"
            className="badge bg-bg-secondary text-text-secondary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            Aparencia
          </a>
        </div>
      </div>
    </div>
  );
}
