'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  TrendingUp,
  Layers,
  Lightbulb,
  Plus,
  ArrowRight,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Loader2,
  Trash2,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/stores/toast-store';
import type { ContentPillar } from '@/types';

// ===== Types =====

interface TopPost {
  id: string;
  postId: string | null;
  title: string;
  format: string;
  pillarName: string | null;
  pillarColor: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  platform: string;
  publishedAt: string;
}

interface UncoveredPillar {
  id: string;
  name: string;
  color: string;
  targetPercentage: number;
}

interface SuggestedHook {
  id: string;
  text: string;
  pillarId: string | null;
  pillarName: string;
  pillarColor: string;
  format: string;
  category: string;
  performanceScore: number;
  usageCount: number;
}

interface IdeationContext {
  topPosts: TopPost[];
  uncoveredPillars: UncoveredPillar[];
  suggestedHooks: SuggestedHook[];
}

interface IdeationIdea {
  id: string;
  text: string;
  pillarId: string | null;
  convertedToPostId: string | null;
  createdAt: string;
}

interface AiIdea {
  title: string;
  hook: string;
  angle: string;
  justification: string;
}

interface ExpandedStep {
  part: number;
  type: string;
  content: string;
  tip: string;
}

interface ExpandedIdea {
  summary: string;
  format: string;
  estimatedParts: number;
  steps: ExpandedStep[];
  hook: string;
  cta: string;
  bestTime: string;
  extraTips: string[];
}

// ===== Helpers =====

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

// ===== Component =====

export default function IdeationPage() {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [context, setContext] = useState<IdeationContext | null>(null);
  const [ideas, setIdeas] = useState<IdeationIdea[]>([]);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIdeaText, setNewIdeaText] = useState('');
  const [addingIdea, setAddingIdea] = useState(false);

  // AI state
  const [aiIdeas, setAiIdeas] = useState<AiIdea[]>([]);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [selectedPillarForAi, setSelectedPillarForAi] = useState<string>('');

  // Expand idea state
  const [expandedPlan, setExpandedPlan] = useState<ExpandedIdea | null>(null);
  const [expandingIdea, setExpandingIdea] = useState(false);
  const [expandSource, setExpandSource] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      const [contextRes, ideasRes, pillarsRes] = await Promise.all([
        fetch('/api/ideation/context'),
        fetch('/api/ideation/ideas'),
        fetch('/api/pillars'),
      ]);

      if (contextRes.ok) {
        const ctx = await contextRes.json() as IdeationContext;
        setContext(ctx);
      }

      if (ideasRes.ok) {
        const ideasData = await ideasRes.json() as IdeationIdea[];
        setIdeas(ideasData);
      }

      if (pillarsRes.ok) {
        const pillarsData = await pillarsRes.json() as ContentPillar[];
        setPillars(pillarsData);
      }
    } catch (error) {
      console.error('Failed to fetch ideation data:', error instanceof Error ? error.message : 'Unknown');
      addToast('Erro ao carregar dados de ideacao', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddIdea = useCallback(async () => {
    if (!newIdeaText.trim()) return;

    setAddingIdea(true);
    try {
      const res = await fetch('/api/ideation/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newIdeaText.trim() }),
      });

      if (!res.ok) throw new Error('Failed to create idea');

      const idea = await res.json() as IdeationIdea;
      setIdeas((prev) => [idea, ...prev]);
      setNewIdeaText('');
      addToast('Ideia adicionada!', 'success');
    } catch {
      addToast('Erro ao adicionar ideia', 'error');
    } finally {
      setAddingIdea(false);
    }
  }, [newIdeaText, addToast]);

  const handleCreatePostFromIdea = useCallback((idea: IdeationIdea) => {
    // Navigate to calendar with the idea text as title
    const params = new URLSearchParams();
    params.set('title', idea.text);
    if (idea.pillarId) params.set('pillarId', idea.pillarId);
    router.push(`/pipeline?newPost=true&${params.toString()}`);
  }, [router]);

  const handleDeleteIdea = useCallback(async (ideaId: string) => {
    try {
      // Optimistic removal
      setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
      addToast('Ideia removida', 'success');
    } catch {
      addToast('Erro ao remover ideia', 'error');
    }
  }, [addToast]);

  const handleGenerateAiIdeas = useCallback(async () => {
    setGeneratingAi(true);
    setAiIdeas([]);
    try {
      const res = await fetch('/api/ai/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pillarId: selectedPillarForAi || undefined,
          includeMetrics: true,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to generate ideas');
      }

      const data = await res.json() as AiIdea[];
      setAiIdeas(data);
      addToast('Ideias geradas com IA!', 'success');
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Erro ao gerar ideias com IA',
        'error'
      );
    } finally {
      setGeneratingAi(false);
    }
  }, [selectedPillarForAi, addToast]);

  const handleExpandIdea = useCallback(async (text?: string) => {
    const ideaText = text || newIdeaText.trim();
    if (!ideaText) return;

    setExpandingIdea(true);
    setExpandedPlan(null);
    setExpandSource(ideaText);
    try {
      const res = await fetch('/api/ai/expand-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ideaText }),
      });

      if (!res.ok) {
        const errorData = await res.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to expand idea');
      }

      const plan = await res.json() as ExpandedIdea;
      setExpandedPlan(plan);
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Erro ao expandir ideia',
        'error'
      );
    } finally {
      setExpandingIdea(false);
    }
  }, [newIdeaText, addToast]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto animate-fade-in">
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="skeleton h-4 w-72 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'rgba(184, 255, 0, 0.12)' }}
          >
            <Sparkles size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-display text-text-primary">Sessao de Ideacao</h1>
            <p className="text-sm text-text-secondary">Planejamento semanal de conteudo</p>
          </div>
        </div>
      </div>

      {/* Top da Semana */}
      {context && context.topPosts.length > 0 && (
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-accent" />
            <h2 className="text-heading-3 text-text-primary">Top da Semana</h2>
            <span className="text-[11px] text-text-tertiary ml-auto">Por shares + comentarios</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
            {context.topPosts.map((post, index) => (
              <div
                key={post.id}
                className="rounded-xl border border-border-default p-4 animate-fade-in"
                style={{ borderLeftColor: post.pillarColor || undefined, borderLeftWidth: post.pillarColor ? '3px' : undefined }}
              >
                <div className="flex items-start gap-2 mb-2">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold shrink-0"
                    style={{
                      backgroundColor: index === 0 ? 'rgba(184, 255, 0, 0.15)' : 'var(--bg-secondary)',
                      color: index === 0 ? '#B8FF00' : 'var(--text-tertiary)',
                    }}
                  >
                    #{index + 1}
                  </span>
                  <p className="text-sm font-medium text-text-primary line-clamp-2">{post.title}</p>
                </div>

                {post.pillarName && (
                  <span
                    className="badge text-[10px] mb-2"
                    style={{
                      backgroundColor: `${post.pillarColor}15`,
                      color: post.pillarColor || undefined,
                    }}
                  >
                    {post.pillarName}
                  </span>
                )}

                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border-default">
                  <div className="flex items-center gap-1">
                    <Eye size={10} className="text-text-tertiary" />
                    <span className="text-[11px] text-text-secondary">{formatNumber(post.views)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart size={10} className="text-text-tertiary" />
                    <span className="text-[11px] text-text-secondary">{formatNumber(post.likes)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle size={10} className="text-text-tertiary" />
                    <span className="text-[11px] font-semibold text-text-primary">{formatNumber(post.comments)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 size={10} className="text-text-tertiary" />
                    <span className="text-[11px] font-semibold text-text-primary">{formatNumber(post.shares)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pilares Descobertos + Hooks Sugeridos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Pilares Descobertos */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={16} className="text-warning" />
            <h2 className="text-heading-3 text-text-primary">Pilares Descobertos</h2>
          </div>
          <p className="text-xs text-text-secondary mb-3">
            Pilares sem conteudo agendado na proxima semana
          </p>

          {context && context.uncoveredPillars.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {context.uncoveredPillars.map((pillar) => (
                <span
                  key={pillar.id}
                  className="badge text-sm py-1.5 px-3"
                  style={{
                    backgroundColor: `${pillar.color}15`,
                    color: pillar.color,
                    borderLeft: `3px solid ${pillar.color}`,
                  }}
                >
                  {pillar.name}
                  <span className="text-[10px] ml-1 opacity-60">({pillar.targetPercentage}%)</span>
                </span>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-success-surface p-4 text-center">
              <p className="text-sm text-success font-medium">Todos os pilares cobertos!</p>
            </div>
          )}
        </div>

        {/* Hooks Sugeridos */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={16} className="text-accent" />
            <h2 className="text-heading-3 text-text-primary">Hooks Sugeridos</h2>
          </div>
          <p className="text-xs text-text-secondary mb-3">
            Melhores hooks para pilares descobertos
          </p>

          {context && context.suggestedHooks.length > 0 ? (
            <div className="space-y-2">
              {context.suggestedHooks.slice(0, 5).map((hook) => (
                <div
                  key={hook.id}
                  className="rounded-lg border border-border-default p-3 hover:border-accent transition-colors cursor-pointer"
                  style={{ borderLeftColor: hook.pillarColor, borderLeftWidth: '3px' }}
                >
                  <p className="text-xs font-medium text-text-primary line-clamp-2">{hook.text}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-text-tertiary">{hook.pillarName}</span>
                    {hook.performanceScore > 0 && (
                      <span className="text-[10px] font-bold text-accent">
                        Score {hook.performanceScore}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary text-center py-4">
              Crie hooks para ver sugestoes
            </p>
          )}
        </div>
      </div>

      {/* AI Ideas Generation */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={16} className="text-accent" />
          <h2 className="text-heading-3 text-text-primary">Gerar Ideias com IA</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select
            value={selectedPillarForAi}
            onChange={(e) => setSelectedPillarForAi(e.target.value)}
            className="input max-w-[200px]"
          >
            <option value="">Todos os pilares</option>
            {pillars.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <button
            onClick={handleGenerateAiIdeas}
            disabled={generatingAi}
            className="btn-accent flex items-center gap-2"
          >
            {generatingAi ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Gerar Ideias
              </>
            )}
          </button>
        </div>

        {aiIdeas.length > 0 && (
          <div className="space-y-3">
            {aiIdeas.map((idea, index) => (
              <div
                key={index}
                className="rounded-xl border border-accent bg-accent-surface p-4 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <p className="text-sm font-semibold text-text-primary mb-1">{idea.title}</p>
                <p className="text-xs text-accent font-medium mb-2">Hook: {idea.hook}</p>
                <p className="text-xs text-text-secondary mb-1">Angulo: {idea.angle}</p>
                <p className="text-[11px] text-text-tertiary">Justificativa: {idea.justification}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ideias Rapidas */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Plus size={16} className="text-accent" />
          <h2 className="text-heading-3 text-text-primary">Ideias Rapidas</h2>
        </div>
        <p className="text-xs text-text-tertiary mb-4">
          Descreva brevemente sua ideia e a IA monta o plano de execucao
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newIdeaText}
            onChange={(e) => setNewIdeaText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleExpandIdea();
              }
            }}
            placeholder="Ex: Sequencia de stories mostrando o Jarvis que acabei de desenvolver..."
            className="input flex-1"
          />
          <button
            onClick={() => handleExpandIdea()}
            disabled={expandingIdea || !newIdeaText.trim()}
            className={cn(
              'btn-accent flex items-center gap-2 shrink-0',
              (expandingIdea || !newIdeaText.trim()) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {expandingIdea ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            Expandir
          </button>
          <button
            onClick={handleAddIdea}
            disabled={addingIdea || !newIdeaText.trim()}
            className={cn(
              'flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-lg border border-border-default text-sm text-text-secondary hover:bg-bg-secondary transition-colors',
              (addingIdea || !newIdeaText.trim()) && 'opacity-50 cursor-not-allowed'
            )}
            title="Salvar sem expandir"
          >
            {addingIdea ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            Salvar
          </button>
        </div>

        {/* Expanded Plan */}
        {(expandingIdea || expandedPlan) && (
          <div className="mt-4 rounded-xl border border-accent bg-accent-surface/30 overflow-hidden animate-fade-in">
            {expandingIdea ? (
              <div className="p-6 flex flex-col items-center gap-3">
                <Loader2 size={24} className="animate-spin text-accent" />
                <p className="text-sm text-text-secondary">Montando plano de execucao...</p>
              </div>
            ) : expandedPlan ? (
              <div>
                {/* Plan Header */}
                <div className="p-4 border-b border-accent/20">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <p className="text-xs text-accent font-semibold uppercase tracking-wider mb-1">
                        Plano de Execucao
                      </p>
                      <p className="text-sm font-medium text-text-primary">{expandedPlan.summary}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="badge text-[10px] bg-accent/15 text-accent">
                        {expandedPlan.format.replace('_', ' ')}
                      </span>
                      <span className="badge text-[10px] bg-bg-secondary text-text-secondary">
                        {expandedPlan.estimatedParts} partes
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-bg-primary/50 p-3 mt-2">
                    <p className="text-xs text-text-tertiary mb-0.5">Hook de abertura:</p>
                    <p className="text-sm font-semibold text-accent">&ldquo;{expandedPlan.hook}&rdquo;</p>
                  </div>
                </div>

                {/* Steps */}
                <div className="p-4">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                    Passo a passo
                  </p>
                  <div className="space-y-3">
                    {expandedPlan.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold shrink-0"
                            style={{ backgroundColor: 'rgba(184, 255, 0, 0.15)', color: '#B8FF00' }}
                          >
                            {step.part}
                          </span>
                          {idx < expandedPlan.steps.length - 1 && (
                            <div className="w-px flex-1 bg-border-default mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-3">
                          <p className="text-[10px] text-text-tertiary uppercase font-medium mb-0.5">
                            {step.type}
                          </p>
                          <p className="text-sm text-text-primary">{step.content}</p>
                          {step.tip && (
                            <p className="text-xs text-text-tertiary mt-1 italic">
                              Dica: {step.tip}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA + Tips */}
                <div className="p-4 border-t border-accent/20 space-y-3">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-text-tertiary mb-0.5">CTA final:</p>
                      <p className="text-sm font-medium text-text-primary">{expandedPlan.cta}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary mb-0.5">Melhor horario:</p>
                      <p className="text-sm font-medium text-text-primary">{expandedPlan.bestTime}</p>
                    </div>
                  </div>

                  {expandedPlan.extraTips.length > 0 && (
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Dicas extras:</p>
                      <ul className="space-y-1">
                        {expandedPlan.extraTips.map((tip, idx) => (
                          <li key={idx} className="text-xs text-text-secondary flex items-start gap-1.5">
                            <span className="text-accent mt-0.5">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set('title', expandSource);
                        router.push(`/pipeline?newPost=true&${params.toString()}`);
                      }}
                      className="btn-accent flex items-center gap-2 text-sm"
                    >
                      <ArrowRight size={14} />
                      Criar Post
                    </button>
                    <button
                      onClick={async () => {
                        // Save as quick idea
                        try {
                          const res = await fetch('/api/ideation/ideas', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: expandSource }),
                          });
                          if (res.ok) {
                            const idea = await res.json() as IdeationIdea;
                            setIdeas((prev) => [idea, ...prev]);
                            addToast('Ideia salva!', 'success');
                          }
                        } catch {
                          addToast('Erro ao salvar ideia', 'error');
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-default text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
                    >
                      <Plus size={14} />
                      Salvar Ideia
                    </button>
                    <button
                      onClick={() => { setExpandedPlan(null); setExpandSource(''); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text-tertiary hover:text-text-secondary transition-colors ml-auto"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Ideas list */}
        {ideas.length > 0 && (
          <div className="mt-4 space-y-2 stagger-children">
            <p className="text-xs text-text-tertiary font-medium">Ideias salvas</p>
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className="flex items-center gap-3 rounded-lg border border-border-default p-3 animate-fade-in group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{idea.text}</p>
                  <p className="text-[10px] text-text-tertiary mt-0.5">
                    {new Date(idea.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleExpandIdea(idea.text)}
                    className="flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-accent transition-colors px-2 py-1 rounded-lg hover:bg-accent-surface"
                    title="Expandir com IA"
                  >
                    <Sparkles size={12} />
                    Expandir
                  </button>
                  <button
                    onClick={() => handleCreatePostFromIdea(idea)}
                    className="flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent-hover transition-colors px-2 py-1 rounded-lg hover:bg-accent-surface"
                  >
                    Criar Post
                    <ArrowRight size={12} />
                  </button>
                  <button
                    onClick={() => handleDeleteIdea(idea.id)}
                    className="p-1.5 rounded-lg text-text-tertiary hover:bg-error-surface hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {ideas.length === 0 && !expandedPlan && !expandingIdea && (
          <p className="text-sm text-text-tertiary text-center py-4 mt-2">
            Descreva sua ideia acima e clique em Expandir para ver o plano de execucao
          </p>
        )}
      </div>
    </div>
  );
}
