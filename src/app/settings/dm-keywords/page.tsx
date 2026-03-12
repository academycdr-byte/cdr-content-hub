'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/stores/toast-store';
import type { DmKeyword, SocialAccount } from '@/types';

export default function DmKeywordsPage() {
  const [keywords, setKeywords] = useState<DmKeyword[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { addToast } = useToastStore();

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/social/accounts');
      if (!res.ok) return;
      const data = await res.json() as SocialAccount[];
      setAccounts(data);
      if (data.length > 0 && !selectedAccountId) {
        setSelectedAccountId(data[0].id);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  const fetchKeywords = useCallback(async (accountId: string) => {
    try {
      const res = await fetch(`/api/dm-keywords?accountId=${accountId}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json() as DmKeyword[];
      setKeywords(data);
    } catch {
      addToast('Erro ao carregar keywords', 'error');
    }
  }, [addToast]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  useEffect(() => {
    if (selectedAccountId) fetchKeywords(selectedAccountId);
  }, [selectedAccountId, fetchKeywords]);

  const handleCreate = useCallback(async (data: { keyword: string; description: string; socialAccountId: string }) => {
    try {
      const res = await fetch('/api/dm-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error || 'Failed');
      }
      const newKw = await res.json() as DmKeyword;
      setKeywords((prev) => [newKw, ...prev]);
      setShowModal(false);
      addToast('Keyword criada!', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Erro', 'error');
    }
  }, [addToast]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Remover esta keyword?')) return;
    try {
      const res = await fetch(`/api/dm-keywords/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setKeywords((prev) => prev.filter((k) => k.id !== id));
      addToast('Keyword removida', 'success');
    } catch {
      addToast('Erro ao remover', 'error');
    }
  }, [addToast]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={24} className="text-accent" />
            <h1 className="text-heading-1 text-text-primary">DM Keywords</h1>
          </div>
          <p className="text-sm text-text-secondary">
            Gerencie as palavras-chave de CTA para rastrear DMs.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-accent inline-flex items-center gap-2"
        >
          <Plus size={16} />
          Nova Keyword
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

      {/* Keywords List */}
      {keywords.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <MessageSquare size={32} className="text-text-tertiary mb-3 opacity-40" />
          <h2 className="text-heading-2 text-text-primary mb-2">Nenhuma keyword</h2>
          <p className="text-sm text-text-secondary">
            Crie keywords para rastrear CTAs de DM nos seus posts.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {keywords.map((kw) => (
            <div key={kw.id} className="card p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-surface shrink-0">
                <span className="text-xs font-bold text-accent">#</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{kw.keyword}</p>
                <p className="text-xs text-text-secondary truncate">{kw.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-text-primary">{kw.totalReceived}</p>
                <p className="text-[10px] text-text-tertiary">DMs recebidas</p>
              </div>
              <button
                onClick={() => handleDelete(kw.id)}
                className="p-1.5 rounded-lg hover:bg-error-surface transition-colors shrink-0"
              >
                <Trash2 size={14} className="text-error" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Settings Navigation */}
      <div className="mt-8 pt-6 border-t border-border-default">
        <p className="text-label text-text-tertiary mb-3">Configurações</p>
        <div className="flex gap-3">
          <a
            href="/settings/pillars"
            className="badge bg-bg-secondary text-text-secondary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            Pilares de Conteúdo
          </a>
          <a
            href="/settings/checklists"
            className="badge bg-bg-secondary text-text-secondary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            Checklists
          </a>
          <span className="badge bg-accent-surface text-accent">
            DM Keywords
          </span>
          <a
            href="/settings/appearance"
            className="badge bg-bg-secondary text-text-secondary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            Aparência
          </a>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && selectedAccountId && (
        <CreateKeywordModal
          accountId={selectedAccountId}
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

function CreateKeywordModal({
  accountId,
  onClose,
  onCreate,
}: {
  accountId: string;
  onClose: () => void;
  onCreate: (data: { keyword: string; description: string; socialAccountId: string }) => Promise<void>;
}) {
  const [keyword, setKeyword] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;
    setSubmitting(true);
    try {
      await onCreate({ keyword: keyword.toUpperCase().trim(), description, socialAccountId: accountId });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 animate-backdrop" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm rounded-2xl bg-bg-modal border border-border-default animate-scale-in"
          style={{ boxShadow: 'var(--shadow-xl)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border-default px-6 py-4">
            <h2 className="text-heading-2 text-text-primary">Nova Keyword</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors">
              <X size={16} className="text-text-secondary" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="text-label text-text-secondary mb-1.5 block">Keyword</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value.toUpperCase())}
                placeholder="Ex: DIAGNOSTICO"
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
                placeholder="O que o lead recebe ao enviar?"
                className="input"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
              <button
                type="submit"
                disabled={submitting || !keyword.trim()}
                className="btn-accent flex-1 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Criar</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
