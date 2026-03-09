'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Lightbulb,
  Plus,
  Search,
  Filter,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/stores/toast-store';
import type { Hook, ContentPillar } from '@/types';
import { FORMATS, FORMAT_FILTER_LABELS, CATEGORIES, CATEGORY_LABELS } from '@/components/hooks/constants';
import { HookCard } from '@/components/hooks/hook-card';
import dynamic from 'next/dynamic';

const HookDetailModal = dynamic(() => import('@/components/hooks/hook-detail-modal').then(m => ({ default: m.HookDetailModal })), { ssr: false });
const CreateHookModal = dynamic(() => import('@/components/hooks/create-hook-modal').then(m => ({ default: m.CreateHookModal })), { ssr: false });

export default function HooksPage() {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortByPerformance, setSortByPerformance] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedHook, setSelectedHook] = useState<Hook | null>(null);
  const { addToast } = useToastStore();
  const router = useRouter();

  const fetchHooks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedPillar) params.set('pillarId', selectedPillar);
      if (selectedFormat !== 'ALL') params.set('format', selectedFormat);
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      if (sortByPerformance) params.set('sortBy', 'performanceScore');

      const res = await fetch(`/api/hooks?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch hooks');
      const data = await res.json() as Hook[];
      setHooks(data);
    } catch (error) {
      console.error('Failed to fetch hooks:', error instanceof Error ? error.message : 'Unknown');
      addToast('Erro ao carregar hooks', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedPillar, selectedFormat, selectedCategory, sortByPerformance, addToast]);

  const fetchPillars = useCallback(async () => {
    try {
      const res = await fetch('/api/pillars');
      if (!res.ok) throw new Error('Failed to fetch pillars');
      const data = await res.json() as ContentPillar[];
      setPillars(data);
    } catch (error) {
      console.error('Failed to fetch pillars:', error instanceof Error ? error.message : 'Unknown');
    }
  }, []);

  useEffect(() => {
    fetchPillars();
  }, [fetchPillars]);

  useEffect(() => {
    setLoading(true);
    fetchHooks();
  }, [fetchHooks]);

  const handleCopy = useCallback(async (hook: Hook) => {
    try {
      const parts = [`Gancho: ${hook.text}`];
      if (hook.scenes) parts.push(`\nCenas:\n${hook.scenes}`);
      if (hook.conclusion) parts.push(`\nConclusão: ${hook.conclusion}`);
      await navigator.clipboard.writeText(parts.join('\n'));
      addToast('Roteiro copiado!', 'success');

      await fetch(`/api/hooks/${hook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incrementUsage: true }),
      });

      setHooks((prev) =>
        prev.map((h) =>
          h.id === hook.id ? { ...h, usageCount: h.usageCount + 1 } : h
        )
      );
    } catch {
      addToast('Erro ao copiar hook', 'error');
    }
  }, [addToast]);

  const handleUseInPost = useCallback((hook: Hook) => {
    const params = new URLSearchParams();
    params.set('hook', hook.text);
    if (hook.pillarId) params.set('pillarId', hook.pillarId);
    if (hook.format !== 'ALL') params.set('format', hook.format);
    router.push(`/calendar?${params.toString()}`);
  }, [router]);

  const handleUpdateHook = useCallback(async (hookId: string, data: {
    text?: string;
    scenes?: string | null;
    conclusion?: string | null;
    pillarId?: string | null;
    format?: string;
    category?: string;
  }) => {
    try {
      const res = await fetch(`/api/hooks/${hookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update hook');
      const updated = await res.json() as Hook;
      setHooks((prev) => prev.map((h) => h.id === hookId ? updated : h));
      setSelectedHook(updated);
      addToast('Ideia atualizada!', 'success');
    } catch {
      addToast('Erro ao atualizar ideia', 'error');
    }
  }, [addToast]);

  const handleDelete = useCallback(async (hookId: string) => {
    const confirmed = window.confirm('Excluir este hook?');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/hooks/${hookId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setHooks((prev) => prev.filter((h) => h.id !== hookId));
      setSelectedHook(null);
      addToast('Hook excluído!', 'success');
    } catch {
      addToast('Erro ao excluir hook', 'error');
    }
  }, [addToast]);

  const handleCreateHook = useCallback(async (data: {
    text: string;
    scenes?: string | null;
    conclusion?: string | null;
    pillarId: string | null;
    format: string;
    category: string;
  }) => {
    try {
      const res = await fetch('/api/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to create hook');

      const newHook = await res.json() as Hook;
      setHooks((prev) => [newHook, ...prev]);
      setShowCreateForm(false);
      addToast('Hook criado com sucesso!', 'success');
    } catch {
      addToast('Erro ao criar hook', 'error');
    }
  }, [addToast]);

  const filteredHooks = searchQuery
    ? hooks.filter((h) =>
        h.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : hooks;

  const getPillarColor = (pillarId: string | null): string => {
    if (!pillarId) return '#6E6E73';
    const pillar = pillars.find((p) => p.id === pillarId);
    return pillar?.color || '#6E6E73';
  };

  const getPillarName = (pillarId: string | null): string => {
    if (!pillarId) return 'Universal';
    const pillar = pillars.find((p) => p.id === pillarId);
    return pillar?.name || 'Desconhecido';
  };

  return (
    <>
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-display text-text-primary">Banco de Ideias</h1>
          <p className="text-sm text-text-secondary mt-1">
            {filteredHooks.length} ideia{filteredHooks.length !== 1 ? 's' : ''} encontrada{filteredHooks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-accent flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          Nova Ideia
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar ideias..."
          className="input pl-9"
        />
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-text-tertiary" />
          <span className="text-xs font-semibold text-text-secondary">Filtros</span>
        </div>

        <div className="space-y-3">
          {/* Pillar filter */}
          <div>
            <span className="text-xs font-medium text-text-secondary mb-1.5 block">Pilar</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedPillar('')}
                className={cn(
                  'badge transition-all cursor-pointer',
                  !selectedPillar
                    ? 'bg-accent-surface text-accent'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                )}
              >
                Todos
              </button>
              {pillars.map((pillar) => (
                <button
                  key={pillar.id}
                  onClick={() => setSelectedPillar(pillar.id)}
                  className={cn(
                    'badge transition-all cursor-pointer',
                    selectedPillar === pillar.id
                      ? 'text-white'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                  )}
                  style={
                    selectedPillar === pillar.id
                      ? { backgroundColor: pillar.color }
                      : undefined
                  }
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: pillar.color }}
                  />
                  {pillar.name}
                </button>
              ))}
            </div>
          </div>

          {/* Format filter */}
          <div>
            <span className="text-xs font-medium text-text-secondary mb-1.5 block">Formato</span>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFormat(f)}
                  className={cn(
                    'badge transition-all cursor-pointer',
                    selectedFormat === f
                      ? 'bg-accent-surface text-accent'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                  )}
                >
                  {FORMAT_FILTER_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <span className="text-xs font-medium text-text-secondary mb-1.5 block">Categoria</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={cn(
                    'badge transition-all cursor-pointer',
                    selectedCategory === c
                      ? 'bg-accent-surface text-accent'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                  )}
                >
                  {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          {/* Sort by performance */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sortByPerformance}
                onChange={(e) => setSortByPerformance(e.target.checked)}
                className="h-4 w-4 rounded accent-accent"
              />
              <span className="text-xs font-medium text-text-secondary">Ordenar por performance</span>
            </label>
          </div>
        </div>
      </div>

      {/* Top Hooks Section */}
      {!loading && !searchQuery && filteredHooks.some((h) => h.performanceScore > 0) && (
        <div className="card p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-accent" />
            <span className="text-xs font-semibold text-text-secondary">Top Hooks por Performance</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filteredHooks
              .filter((h) => h.performanceScore > 0)
              .sort((a, b) => b.performanceScore - a.performanceScore)
              .slice(0, 3)
              .map((hook) => (
                <button
                  key={hook.id}
                  onClick={() => setSelectedHook(hook)}
                  className="flex items-center gap-2 rounded-lg border border-accent bg-accent-surface px-3 py-2 text-left transition-colors hover:bg-accent-surface-hover cursor-pointer"
                >
                  <span className="text-xs font-bold text-accent">
                    {hook.performanceScore}
                  </span>
                  <span className="text-xs text-text-primary truncate max-w-[200px]">
                    {hook.text}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Hook List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-20 w-full" />
          ))}
        </div>
      ) : filteredHooks.length === 0 ? (
        <div className="card p-12 sm:p-16 flex flex-col items-center justify-center text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl mb-4"
            style={{ backgroundColor: 'rgba(184, 255, 0, 0.12)' }}
          >
            <Lightbulb size={28} className="text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">Nenhuma ideia encontrada</h2>
          <p className="text-sm text-text-secondary max-w-md">
            Tente ajustar os filtros ou crie uma nova ideia.
          </p>
        </div>
      ) : (
        <div className="space-y-2 stagger-children">
          {filteredHooks.map((hook, index) => (
            <HookCard
              key={hook.id}
              hook={hook}
              index={index + 1}
              pillarColor={getPillarColor(hook.pillarId)}
              pillarName={getPillarName(hook.pillarId)}
              onCopy={handleCopy}
              onClick={() => setSelectedHook(hook)}
            />
          ))}
        </div>
      )}

    </div>

    {/* Modals rendered outside animate-fade-in to prevent transform breaking fixed positioning */}
    {showCreateForm && (
      <CreateHookModal
        pillars={pillars}
        onSubmit={handleCreateHook}
        onClose={() => setShowCreateForm(false)}
      />
    )}

    {selectedHook && (
      <HookDetailModal
        hook={selectedHook}
        pillars={pillars}
        pillarColor={getPillarColor(selectedHook.pillarId)}
        pillarName={getPillarName(selectedHook.pillarId)}
        onClose={() => setSelectedHook(null)}
        onCopy={handleCopy}
        onUseInPost={handleUseInPost}
        onDelete={handleDelete}
        onUpdate={handleUpdateHook}
      />
    )}
    </>
  );
}
