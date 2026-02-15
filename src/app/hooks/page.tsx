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
  Check,
  Edit3,
  Trash2,
  ChevronDown,
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

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  QUESTION: { bg: 'rgba(48, 176, 199, 0.12)', text: '#30B0C7' },
  STATISTIC: { bg: 'rgba(52, 199, 89, 0.12)', text: '#34C759' },
  CONTRARIAN: { bg: 'rgba(255, 69, 58, 0.12)', text: '#FF453A' },
  STORY_HOOK: { bg: 'rgba(191, 90, 242, 0.12)', text: '#BF5AF2' },
  CHALLENGE: { bg: 'rgba(255, 159, 10, 0.12)', text: '#FF9F0A' },
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
  const [selectedHook, setSelectedHook] = useState<Hook | null>(null);
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
      const parts = [`Gancho: ${hook.text}`];
      if (hook.scenes) parts.push(`\nCenas:\n${hook.scenes}`);
      if (hook.conclusion) parts.push(`\nConclusao: ${hook.conclusion}`);
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

  const handleDelete = useCallback(async (hookId: string) => {
    const confirmed = window.confirm('Excluir este hook?');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/hooks/${hookId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setHooks((prev) => prev.filter((h) => h.id !== hookId));
      setSelectedHook(null);
      addToast('Hook excluido!', 'success');
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
        pillarColor={getPillarColor(selectedHook.pillarId)}
        pillarName={getPillarName(selectedHook.pillarId)}
        onClose={() => setSelectedHook(null)}
        onCopy={handleCopy}
        onUseInPost={handleUseInPost}
        onDelete={handleDelete}
      />
    )}
    </>
  );
}

// ===== Hook Card Component =====

interface HookCardProps {
  hook: Hook;
  index: number;
  pillarColor: string;
  pillarName: string;
  onCopy: (hook: Hook) => void;
  onClick: () => void;
}

function HookCard({ hook, index, pillarColor, pillarName, onCopy, onClick }: HookCardProps) {
  const catColors = CATEGORY_COLORS[hook.category] || { bg: 'rgba(142, 142, 147, 0.12)', text: '#8E8E93' };

  return (
    <div
      className="card card-hover p-4 flex items-start gap-4 animate-fade-in cursor-pointer"
      style={{ borderLeft: `3px solid ${pillarColor}` }}
      onClick={onClick}
    >
      {/* Number badge */}
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0"
        style={{ backgroundColor: catColors.bg, color: catColors.text }}
      >
        #{index}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary leading-relaxed line-clamp-2">
          {hook.text}
        </p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
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
          <span
            className="badge text-[11px]"
            style={{ backgroundColor: catColors.bg, color: catColors.text }}
          >
            {CATEGORY_LABELS[hook.category] || hook.category}
          </span>
          {hook.usageCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-text-tertiary">
              <Hash size={10} />
              {hook.usageCount}x
            </span>
          )}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onCopy(hook);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-colors shrink-0"
        title="Copiar"
      >
        <Copy size={15} />
      </button>
    </div>
  );
}

// ===== Hook Detail Modal =====

interface HookDetailModalProps {
  hook: Hook;
  pillarColor: string;
  pillarName: string;
  onClose: () => void;
  onCopy: (hook: Hook) => void;
  onUseInPost: (hook: Hook) => void;
  onDelete: (hookId: string) => void;
}

function HookDetailModal({ hook, pillarColor, pillarName, onClose, onCopy, onUseInPost, onDelete }: HookDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const catColors = CATEGORY_COLORS[hook.category] || { bg: 'rgba(142, 142, 147, 0.12)', text: '#8E8E93' };

  const handleCopy = async () => {
    await onCopy(hook);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scenesLines = hook.scenes?.split('\n').filter((line) => line.trim()) || [];
  const conclusionLines = hook.conclusion?.split('\n').filter((line) => line.trim()) || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 animate-backdrop" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div
          className="relative bg-bg-card border border-border-default rounded-2xl w-full max-w-xl animate-scale-in"
          style={{ boxShadow: 'var(--shadow-xl)' }}
        >
          <div className="max-h-[85vh] overflow-y-auto rounded-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-bg-card rounded-t-2xl border-b border-border-default">
              <div className="flex items-start gap-3 p-4 sm:p-5">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0 mt-0.5"
                  style={{ backgroundColor: catColors.bg, color: catColors.text }}
                >
                  <Lightbulb size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className="badge text-[11px]"
                      style={{ backgroundColor: catColors.bg, color: catColors.text }}
                    >
                      {CATEGORY_LABELS[hook.category] || hook.category}
                    </span>
                    <span
                      className="badge text-[11px]"
                      style={{ backgroundColor: `${pillarColor}15`, color: pillarColor }}
                    >
                      {pillarName}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-text-primary leading-snug">
                    Ideia de Conteudo
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors text-text-tertiary shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex items-center gap-2 px-4 sm:px-5 pb-4">
                <button
                  onClick={() => onUseInPost(hook)}
                  className="btn-accent flex items-center gap-2 text-sm"
                >
                  <ArrowRight size={14} />
                  Usar em Post
                </button>
                <button
                  onClick={handleCopy}
                  className={cn(
                    'btn-ghost flex items-center gap-2 text-sm',
                    copied && 'text-success'
                  )}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => onDelete(hook.id)}
                  className="p-2 rounded-lg text-text-tertiary hover:bg-error-surface hover:text-error transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Content - Structured sections */}
            <div className="p-4 sm:p-5 space-y-4">
              {/* Formato */}
              <div>
                <p className="text-xs font-semibold text-text-secondary mb-2">Formato</p>
                <div className="rounded-xl bg-bg-secondary p-3">
                  <p className="text-sm text-accent font-medium">
                    {FORMAT_LABELS[hook.format as PostFormat] || 'Todos os formatos'}
                  </p>
                </div>
              </div>

              {/* Gancho */}
              <div>
                <p className="text-xs font-semibold text-text-secondary mb-2">Gancho</p>
                <div className="rounded-xl bg-bg-secondary p-4">
                  <p className="text-sm text-text-primary leading-relaxed">{hook.text}</p>
                </div>
              </div>

              {/* Cenas */}
              <div>
                <p className="text-xs font-semibold text-text-secondary mb-2">Cenas</p>
                <div className="rounded-xl bg-bg-secondary p-4">
                  {scenesLines.length > 0 ? (
                    <div className="space-y-2">
                      {scenesLines.map((line, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-xs font-bold text-accent mt-0.5 shrink-0">{i + 1}.</span>
                          <p className="text-sm text-text-primary leading-relaxed">{line}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-tertiary italic">Nenhuma cena definida</p>
                  )}
                </div>
              </div>

              {/* Conclusao */}
              <div>
                <p className="text-xs font-semibold text-text-secondary mb-2">Conclusao</p>
                <div className="rounded-xl bg-bg-secondary p-4">
                  {conclusionLines.length > 0 ? (
                    <div className="space-y-2">
                      {conclusionLines.map((line, i) => (
                        <p key={i} className="text-sm text-text-primary leading-relaxed">{line}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-tertiary italic">Nenhuma conclusao definida</p>
                  )}
                </div>
              </div>

              {/* Metadata row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-text-secondary mb-2">Categoria</p>
                  <div className="rounded-xl bg-bg-secondary p-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: catColors.text }} />
                      <p className="text-sm text-text-primary font-medium">
                        {CATEGORY_LABELS[hook.category] || hook.category}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-secondary mb-2">Pilar</p>
                  <div className="rounded-xl bg-bg-secondary p-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pillarColor }} />
                      <p className="text-sm text-text-primary font-medium">{pillarName}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Uso */}
              <div>
                <p className="text-xs font-semibold text-text-secondary mb-2">Uso</p>
                <div className="rounded-xl bg-bg-secondary p-3 flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'rgba(184, 255, 0, 0.12)' }}
                  >
                    <Hash size={14} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{hook.usageCount}x utilizado</p>
                    <p className="text-[11px] text-text-tertiary">
                      {hook.usageCount === 0
                        ? 'Ainda nao foi usado em nenhum post'
                        : `Usado em ${hook.usageCount} post${hook.usageCount > 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Create Hook Modal =====

interface CreateHookModalProps {
  pillars: ContentPillar[];
  onSubmit: (data: {
    text: string;
    scenes?: string | null;
    conclusion?: string | null;
    pillarId: string | null;
    format: string;
    category: string;
  }) => Promise<void>;
  onClose: () => void;
}

function CreateHookModal({ pillars, onSubmit, onClose }: CreateHookModalProps) {
  const [text, setText] = useState('');
  const [scenes, setScenes] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [pillarId, setPillarId] = useState<string | null>(null);
  const [format, setFormat] = useState('ALL');
  const [category, setCategory] = useState('QUESTION');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setSaving(true);
    try {
      await onSubmit({
        text: text.trim(),
        scenes: scenes.trim() || null,
        conclusion: conclusion.trim() || null,
        pillarId,
        format,
        category,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 animate-backdrop" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div
          className="relative w-full max-w-lg rounded-2xl bg-bg-card border border-border-default animate-scale-in"
          style={{ boxShadow: 'var(--shadow-xl)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-h-[85vh] overflow-y-auto rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border-default p-4 sm:p-5 bg-bg-card rounded-t-2xl">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
            style={{ backgroundColor: 'rgba(184, 255, 0, 0.12)' }}
          >
            <Lightbulb size={18} className="text-accent" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-text-primary">Nova Ideia</h2>
            <p className="text-xs text-text-tertiary">Estruture seu roteiro de conteudo</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-tertiary hover:bg-bg-hover transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5">
          {/* Section: Roteiro */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-text-secondary tracking-wide">Roteiro</p>

            {/* Gancho */}
            <div>
              <label className="text-xs text-text-tertiary mb-1 block">Gancho *</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="A frase de abertura que prende a atencao. Ex: Voce sabia que 80% dos e-commerces perdem dinheiro em ads?"
                className="input min-h-[72px] resize-y"
                autoFocus
              />
            </div>

            {/* Cenas */}
            <div>
              <label className="text-xs text-text-tertiary mb-1 block">Cenas</label>
              <textarea
                value={scenes}
                onChange={(e) => setScenes(e.target.value)}
                placeholder="Descreva cada cena em uma linha. Ex:&#10;Mostrar dashboard com metricas&#10;Explicar estrategia X&#10;Revelar resultado final"
                className="input min-h-[90px] resize-y"
              />
              <p className="text-[11px] text-text-tertiary mt-1">Uma cena por linha</p>
            </div>

            {/* Conclusao */}
            <div>
              <label className="text-xs text-text-tertiary mb-1 block">Conclusao</label>
              <textarea
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                placeholder="CTA ou fechamento. Ex: Comenta QUERO que eu te ensino como fazer"
                className="input min-h-[56px] resize-y"
              />
            </div>
          </div>

          {/* Section: Classificacao */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-text-secondary tracking-wide">Classificacao</p>

            {/* Format */}
            <div>
              <label className="text-xs text-text-tertiary mb-1.5 block">Formato</label>
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

            {/* Pillar */}
            <div>
              <label className="text-xs text-text-tertiary mb-1.5 block">Pilar</label>
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

            {/* Category */}
            <div>
              <label className="text-xs text-text-tertiary mb-1.5 block">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.filter((c) => c !== 'ALL').map((c) => {
                  const colors = CATEGORY_COLORS[c] || { bg: 'rgba(142, 142, 147, 0.12)', text: '#8E8E93' };
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={cn(
                        'badge transition-all cursor-pointer',
                        category === c
                          ? ''
                          : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                      )}
                      style={
                        category === c
                          ? { backgroundColor: colors.bg, color: colors.text }
                          : undefined
                      }
                    >
                      {CATEGORY_LABELS[c]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-border-default">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 text-sm">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !text.trim()}
              className={cn(
                'btn-accent flex-1 flex items-center justify-center gap-2 text-sm',
                (saving || !text.trim()) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Ideia'
              )}
            </button>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
}
