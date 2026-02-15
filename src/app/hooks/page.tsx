'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Lightbulb,
  Copy,
  ArrowRight,
  Plus,
  X,
  Loader2,
  Search,
  Filter,
  Hash,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/stores/toast-store';
import type { Hook, ContentPillar, PostFormat, HookCategory } from '@/types';
import { FORMAT_LABELS } from '@/types';

const FORMATS: Array<PostFormat | 'ALL'> = ['ALL', 'REEL', 'CAROUSEL', 'STATIC', 'STORY'];

const FORMAT_FILTER_LABELS: Record<string, string> = {
  ALL: 'Todos',
  REEL: 'Reel',
  CAROUSEL: 'Carrossel',
  STATIC: 'Post',
  STORY: 'Story',
};

const CATEGORIES: Array<HookCategory | 'ALL'> = ['ALL', 'QUESTION', 'STATISTIC', 'CONTRARIAN', 'STORY_HOOK', 'CHALLENGE'];

const CATEGORY_LABELS: Record<string, string> = {
  ALL: 'Todas',
  QUESTION: 'Pergunta',
  STATISTIC: 'Estatistica',
  CONTRARIAN: 'Contrario',
  STORY_HOOK: 'Historia',
  CHALLENGE: 'Desafio',
};

export default function HooksPage() {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { addToast } = useToastStore();
  const router = useRouter();

  const fetchHooks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedPillar) params.set('pillarId', selectedPillar);
      if (selectedFormat !== 'ALL') params.set('format', selectedFormat);
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);

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
  }, [selectedPillar, selectedFormat, selectedCategory, addToast]);

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
      await navigator.clipboard.writeText(hook.text);
      addToast('Hook copiado!', 'success');

      // Increment usage count
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

  const handleCreateHook = useCallback(async (data: {
    text: string;
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

  // Filter hooks by search query locally
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
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-heading-1 text-text-primary mb-1">Banco de Hooks</h1>
          <p className="text-sm text-text-secondary">
            {filteredHooks.length} hook{filteredHooks.length !== 1 ? 's' : ''} encontrado{filteredHooks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-accent flex items-center gap-2"
        >
          <Plus size={16} />
          Novo Hook
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar hooks..."
          className="input pl-9"
        />
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-text-tertiary" />
          <span className="text-label text-text-tertiary">Filtros</span>
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
        </div>
      </div>

      {/* Hook List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-20 w-full" />
          ))}
        </div>
      ) : filteredHooks.length === 0 ? (
        <div className="card p-16 flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-surface mb-4">
            <Lightbulb size={28} className="text-accent" />
          </div>
          <h2 className="text-heading-2 text-text-primary mb-2">Nenhum hook encontrado</h2>
          <p className="text-sm text-text-secondary max-w-md">
            Tente ajustar os filtros ou criar um novo hook personalizado.
          </p>
        </div>
      ) : (
        <div className="space-y-2 stagger-children">
          {filteredHooks.map((hook) => (
            <HookCard
              key={hook.id}
              hook={hook}
              pillarColor={getPillarColor(hook.pillarId)}
              pillarName={getPillarName(hook.pillarId)}
              onCopy={handleCopy}
              onUseInPost={handleUseInPost}
            />
          ))}
        </div>
      )}

      {/* Create Hook Modal */}
      {showCreateForm && (
        <CreateHookModal
          pillars={pillars}
          onSubmit={handleCreateHook}
          onClose={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}

// ===== Hook Card Component =====

interface HookCardProps {
  hook: Hook;
  pillarColor: string;
  pillarName: string;
  onCopy: (hook: Hook) => void;
  onUseInPost: (hook: Hook) => void;
}

function HookCard({ hook, pillarColor, pillarName, onCopy, onUseInPost }: HookCardProps) {
  return (
    <div
      className="card card-hover p-4 flex items-start gap-4 animate-fade-in"
      style={{ borderLeft: `3px solid ${pillarColor}` }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary leading-relaxed">
          {hook.text}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span
            className="badge text-[11px]"
            style={{
              backgroundColor: `${pillarColor}15`,
              color: pillarColor,
            }}
          >
            {pillarName}
          </span>
          <span className="badge bg-bg-secondary text-text-secondary text-[11px]">
            {FORMAT_LABELS[hook.format as PostFormat] || hook.format}
          </span>
          <span className="badge bg-bg-secondary text-text-secondary text-[11px]">
            {CATEGORY_LABELS[hook.category] || hook.category}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-text-tertiary">
            <Hash size={10} />
            {hook.usageCount}x usado
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onCopy(hook)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-colors"
          title="Copiar hook"
        >
          <Copy size={15} />
        </button>
        <button
          onClick={() => onUseInPost(hook)}
          className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-accent bg-accent-surface hover:bg-accent-surface-hover transition-colors"
          title="Usar em post"
        >
          <ArrowRight size={13} />
          Usar
        </button>
      </div>
    </div>
  );
}

// ===== Create Hook Modal =====

interface CreateHookModalProps {
  pillars: ContentPillar[];
  onSubmit: (data: {
    text: string;
    pillarId: string | null;
    format: string;
    category: string;
  }) => Promise<void>;
  onClose: () => void;
}

function CreateHookModal({ pillars, onSubmit, onClose }: CreateHookModalProps) {
  const [text, setText] = useState('');
  const [pillarId, setPillarId] = useState<string | null>(null);
  const [format, setFormat] = useState('ALL');
  const [category, setCategory] = useState('QUESTION');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setSaving(true);
    try {
      await onSubmit({ text: text.trim(), pillarId, format, category });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 animate-backdrop" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-[520px] rounded-2xl bg-bg-card border border-border-default animate-scale-in"
          style={{ boxShadow: 'var(--shadow-xl)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-default px-6 py-4">
            <h2 className="text-heading-2 text-text-primary">Novo Hook</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Text */}
            <div>
              <label htmlFor="hook-text" className="text-label text-text-secondary mb-2 block">
                Texto do Hook
              </label>
              <textarea
                id="hook-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ex: Voce sabia que 80% dos e-commerces perdem dinheiro em trafego pago?"
                className="input min-h-[100px] resize-y"
                autoFocus
              />
            </div>

            {/* Pillar */}
            <div>
              <label className="text-label text-text-secondary mb-2 block">Pilar</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPillarId(null)}
                  className={cn(
                    'badge transition-all cursor-pointer',
                    !pillarId
                      ? 'bg-accent-surface text-accent'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                  )}
                >
                  Universal
                </button>
                {pillars.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPillarId(p.id)}
                    className={cn(
                      'badge transition-all cursor-pointer',
                      pillarId === p.id
                        ? 'text-white'
                        : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                    )}
                    style={
                      pillarId === p.id
                        ? { backgroundColor: p.color }
                        : undefined
                    }
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div>
              <label className="text-label text-text-secondary mb-2 block">Formato</label>
              <div className="flex flex-wrap gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={cn(
                      'badge transition-all cursor-pointer',
                      format === f
                        ? 'bg-accent-surface text-accent'
                        : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                    )}
                  >
                    {FORMAT_FILTER_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-label text-text-secondary mb-2 block">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={cn(
                      'badge transition-all cursor-pointer',
                      category === c
                        ? 'bg-accent-surface text-accent'
                        : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                    )}
                  >
                    {CATEGORY_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !text.trim()}
                className="btn-accent flex-1 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Hook'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
