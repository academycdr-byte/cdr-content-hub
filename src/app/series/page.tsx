'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit3,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/stores/toast-store';
import { SERIES_FREQUENCIES } from '@/types';
import type { ContentSeries, SocialAccount } from '@/types';

export default function SeriesPage() {
  const [seriesList, setSeriesList] = useState<ContentSeries[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSeries, setEditingSeries] = useState<ContentSeries | null>(null);
  const { addToast } = useToastStore();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const accRes = await fetch('/api/social/accounts');
      if (accRes.ok) {
        const accData = await accRes.json() as SocialAccount[];
        setAccounts(accData);
        if (accData.length > 0 && !selectedAccountId) {
          setSelectedAccountId(accData[0].id);
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [selectedAccountId]);

  const fetchSeries = useCallback(async (accountId: string) => {
    try {
      const res = await fetch(`/api/series?accountId=${accountId}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json() as ContentSeries[];
      setSeriesList(data);
    } catch {
      addToast('Erro ao carregar séries', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedAccountId) {
      fetchSeries(selectedAccountId);
    }
  }, [selectedAccountId, fetchSeries]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Remover esta série?')) return;
    try {
      const res = await fetch(`/api/series/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setSeriesList((prev) => prev.filter((s) => s.id !== id));
      addToast('Série removida', 'success');
    } catch {
      addToast('Erro ao remover série', 'error');
    }
  }, [addToast]);

  const handleCreate = useCallback(async (data: {
    name: string;
    description: string;
    socialAccountId: string;
    frequency: string;
    color: string;
  }) => {
    try {
      const res = await fetch('/api/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error || 'Failed');
      }
      const newSeries = await res.json() as ContentSeries;
      setSeriesList((prev) => [newSeries, ...prev]);
      setShowModal(false);
      addToast('Série criada com sucesso!', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Erro ao criar série', 'error');
    }
  }, [addToast]);

  const handleUpdate = useCallback(async (id: string, data: Partial<ContentSeries>) => {
    try {
      const res = await fetch(`/api/series/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      const updated = await res.json() as ContentSeries;
      setSeriesList((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setEditingSeries(null);
      addToast('Série atualizada', 'success');
    } catch {
      addToast('Erro ao atualizar série', 'error');
    }
  }, [addToast]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers size={24} className="text-accent" />
            <h1 className="text-heading-1 text-text-primary">Séries de Conteúdo</h1>
          </div>
          <p className="text-sm text-text-secondary">
            Organize seu conteúdo em séries recorrentes.
          </p>
        </div>
        <button
          onClick={() => { setEditingSeries(null); setShowModal(true); }}
          className="btn-accent inline-flex items-center gap-2"
        >
          <Plus size={16} />
          Nova Série
        </button>
      </div>

      {/* Account filter */}
      {accounts.length > 1 && (
        <div className="mb-6 flex gap-2">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id)}
              className={cn(
                'rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                selectedAccountId === acc.id
                  ? 'border-accent bg-accent-surface text-accent'
                  : 'border-border-default bg-bg-primary text-text-secondary hover:border-border-strong'
              )}
            >
              {acc.platform === 'instagram' ? 'IG' : 'TT'} @{acc.username}
            </button>
          ))}
        </div>
      )}

      {/* Series List */}
      {seriesList.length === 0 ? (
        <div className="card p-16 flex flex-col items-center justify-center text-center">
          <Layers size={32} className="text-text-tertiary mb-3 opacity-40" />
          <h2 className="text-heading-2 text-text-primary mb-2">Nenhuma série criada</h2>
          <p className="text-sm text-text-secondary mb-4">
            Crie séries para organizar seu conteúdo recorrente.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {seriesList.map((series) => (
            <div key={series.id} className="card p-5">
              <div className="flex items-start gap-4">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
                  style={{ backgroundColor: `${series.color}20`, color: series.color }}
                >
                  {series.icon || '#'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-text-primary">{series.name}</h3>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-bg-hover text-text-tertiary">
                      {SERIES_FREQUENCIES[series.frequency as keyof typeof SERIES_FREQUENCIES] || series.frequency}
                    </span>
                    {!series.isActive && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-warning-surface text-warning">
                        Pausada
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-1">{series.description}</p>
                  <p className="text-[10px] text-text-tertiary mt-1">
                    EP {series.currentEpisode}
                    {series.totalEpisodes ? ` / ${series.totalEpisodes}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setEditingSeries(series); setShowModal(true); }}
                    className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors"
                  >
                    <Edit3 size={14} className="text-text-tertiary" />
                  </button>
                  <button
                    onClick={() => handleDelete(series.id)}
                    className="p-1.5 rounded-lg hover:bg-error-surface transition-colors"
                  >
                    <Trash2 size={14} className="text-error" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <SeriesModal
          series={editingSeries}
          accountId={selectedAccountId || ''}
          onClose={() => { setShowModal(false); setEditingSeries(null); }}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}

// ===== Series Modal =====

function SeriesModal({
  series,
  accountId,
  onClose,
  onCreate,
  onUpdate,
}: {
  series: ContentSeries | null;
  accountId: string;
  onClose: () => void;
  onCreate: (data: { name: string; description: string; socialAccountId: string; frequency: string; color: string }) => Promise<void>;
  onUpdate: (id: string, data: Partial<ContentSeries>) => Promise<void>;
}) {
  const [name, setName] = useState(series?.name || '');
  const [description, setDescription] = useState(series?.description || '');
  const [frequency, setFrequency] = useState(series?.frequency || 'weekly');
  const [color, setColor] = useState(series?.color || '#B8FF00');
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!series;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      if (isEdit) {
        await onUpdate(series.id, { name, description, frequency, color });
      } else {
        await onCreate({ name, description, socialAccountId: accountId, frequency, color });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 animate-backdrop" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-2xl bg-bg-modal border border-border-default animate-scale-in"
          style={{ boxShadow: 'var(--shadow-xl)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border-default px-6 py-4">
            <h2 className="text-heading-2 text-text-primary">
              {isEdit ? 'Editar Série' : 'Nova Série'}
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors">
              <X size={16} className="text-text-secondary" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="text-label text-text-secondary mb-1.5 block">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: CDR De Zero a 1M"
                className="input"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="text-label text-text-secondary mb-1.5 block">Descrição</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Sobre o que é essa série?"
                className="input"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-label text-text-secondary mb-1.5 block">Frequência</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="input"
                >
                  {Object.entries(SERIES_FREQUENCIES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="w-20">
                <label className="text-label text-text-secondary mb-1.5 block">Cor</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-full cursor-pointer rounded-lg border border-border-default"
                  style={{ padding: 2 }}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="btn-accent flex-1 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : isEdit ? (
                  'Salvar'
                ) : (
                  <>
                    <Plus size={14} />
                    Criar Série
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
