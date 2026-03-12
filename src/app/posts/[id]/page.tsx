'use client';

import { useEffect, useState, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  ArrowRight,
  Save,
  Loader2,
  AlertTriangle,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/stores/toast-store';
import { FRAMEWORKS, getHashtagSuggestions } from '@/lib/frameworks';
import FrameworkEditor from '@/components/post-builder/framework-editor';
import ContentPreview from '@/components/post-builder/content-preview';
import PostSidebar from '@/components/post-builder/post-sidebar';
import type { Post, ContentPillar, PostFormat, PostStatus } from '@/types';
import { STATUS_ORDER, STATUS_LABELS } from '@/types';

interface PostBuilderPageProps {
  params: Promise<{ id: string }>;
}

export default function PostBuilderPage({ params }: PostBuilderPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToastStore();

  const [post, setPost] = useState<Post | null>(null);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  // Framework field values: stored as JSON in post.body
  const [frameworkValues, setFrameworkValues] = useState<Record<string, string>>({});
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [purpose, setPurpose] = useState('');
  const [audience, setAudience] = useState('');
  const [onlyIvan, setOnlyIvan] = useState(false);
  const [referenceLink, setReferenceLink] = useState('');

  // AI analysis
  const [aiAnalysis, setAiAnalysis] = useState<{
    onlyIvanScore: number;
    analysis: string;
    suggestion: string;
  } | null>(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);

  // Checklist state (Story 2.4)
  const [checklistTemplateItems, setChecklistTemplateItems] = useState<string[]>([]);
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [checklistLoading, setChecklistLoading] = useState(false);

  // Auto-save
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  // Fetch post and pillars
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [postRes, pillarsRes] = await Promise.all([
        fetch(`/api/posts/${id}`),
        fetch('/api/pillars'),
      ]);

      if (!postRes.ok) throw new Error('Post not found');
      if (!pillarsRes.ok) throw new Error('Failed to fetch pillars');

      const postData = await postRes.json() as Post;
      const pillarsData = await pillarsRes.json() as ContentPillar[];

      setPost(postData);
      setPillars(pillarsData);
      setTitle(postData.title);
      setCaption(postData.caption || '');
      setHashtags(postData.hashtags || '');
      setPurpose(postData.purpose || '');
      setAudience(postData.audience || '');
      setOnlyIvan(postData.onlyIvan || false);
      setReferenceLink(postData.referenceLink || '');

      // Parse body as framework values
      if (postData.body) {
        try {
          const parsed = JSON.parse(postData.body) as Record<string, string>;
          setFrameworkValues(parsed);
        } catch {
          // If body is not JSON, put it in the first field
          setFrameworkValues({ hook: postData.body });
        }
      }

      // Set hook field from post.hook if present
      if (postData.hook) {
        setFrameworkValues((prev) => ({
          ...prev,
          hook: prev.hook || postData.hook || '',
          cover: prev.cover || postData.hook || '',
          image: prev.image || '',
          visual: prev.visual || '',
        }));
      }

      // Fetch checklist for current stage
      fetchChecklist(postData.id, postData.status);
    } catch (error) {
      console.error('Failed to fetch post:', error instanceof Error ? error.message : 'Unknown');
      addToast('Erro ao carregar post', 'error');
      router.push('/pipeline');
    } finally {
      setLoading(false);
    }
  }, [id, addToast, router]);

  const fetchChecklist = useCallback(async (postId: string, _status: string) => {
    setChecklistLoading(true);
    try {
      const res = await fetch(`/api/checklists/${postId}`);
      if (!res.ok) {
        setChecklistTemplateItems([]);
        setCompletedItems([]);
        return;
      }

      const data = await res.json() as {
        templateItems: string[];
        completedItems: string[];
      };

      setChecklistTemplateItems(data.templateItems || []);
      setCompletedItems(data.completedItems || []);
    } catch {
      setChecklistTemplateItems([]);
      setCompletedItems([]);
    } finally {
      setChecklistLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const currentData = JSON.stringify({ title, caption, hashtags, frameworkValues, purpose, audience, onlyIvan, referenceLink });

    if (lastSavedRef.current === currentData || !post) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      await savePost(true);
      lastSavedRef.current = currentData;
    }, 30000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, caption, hashtags, frameworkValues, purpose, audience, onlyIvan, referenceLink, post]);

  // Save post
  const savePost = useCallback(async (isAutoSave = false) => {
    if (!post) return;

    if (!isAutoSave) setSaving(true);

    try {
      const body = JSON.stringify(frameworkValues);
      const hookValue = frameworkValues.hook || frameworkValues.cover || frameworkValues.image || frameworkValues.visual || '';

      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          hook: hookValue,
          body,
          caption,
          hashtags,
          purpose: purpose || null,
          audience: audience || null,
          onlyIvan,
          referenceLink: referenceLink || null,
          script: post.script || null,
          productionNotes: post.productionNotes || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      const updatedPost = await res.json() as Post;
      setPost(updatedPost);

      if (!isAutoSave) {
        addToast('Post salvo com sucesso!', 'success');
      }
    } catch {
      if (!isAutoSave) {
        addToast('Erro ao salvar post', 'error');
      }
    } finally {
      if (!isAutoSave) setSaving(false);
    }
  }, [post, title, caption, hashtags, frameworkValues, purpose, audience, onlyIvan, referenceLink, addToast]);

  // Advance status
  const advanceStatus = useCallback(async () => {
    if (!post) return;

    const currentIndex = STATUS_ORDER.indexOf(post.status as PostStatus);
    if (currentIndex === -1 || currentIndex >= STATUS_ORDER.length - 1) {
      addToast('Este post já está no último status', 'info');
      return;
    }

    // Check if checklist is completed before advancing
    if (checklistTemplateItems.length > 0) {
      const uncompleted = checklistTemplateItems.filter(
        (item) => !completedItems.includes(item)
      );
      if (uncompleted.length > 0) {
        addToast(
          `Complete a checklist antes de avançar (${uncompleted.length} item${uncompleted.length !== 1 ? 's' : ''} pendente${uncompleted.length !== 1 ? 's' : ''})`,
          'error'
        );
        return;
      }
    }

    const nextStatus = STATUS_ORDER[currentIndex + 1];

    setAdvancing(true);
    try {
      // Save first
      await savePost(true);

      const res = await fetch(`/api/posts/${post.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) throw new Error('Failed to advance status');

      const updatedPost = await res.json() as Post;
      setPost(updatedPost);
      addToast(`Status atualizado para: ${STATUS_LABELS[nextStatus]}`, 'success');

      // Refresh checklist for new stage
      fetchChecklist(post.id, nextStatus);
    } catch {
      addToast('Erro ao avançar status', 'error');
    } finally {
      setAdvancing(false);
    }
  }, [post, checklistTemplateItems, completedItems, savePost, addToast, fetchChecklist]);

  // Handle checklist toggle
  const toggleChecklistItem = useCallback(async (item: string) => {
    if (!post) return;

    const isCompleted = completedItems.includes(item);
    const newCompleted = isCompleted
      ? completedItems.filter((i) => i !== item)
      : [...completedItems, item];

    setCompletedItems(newCompleted);

    try {
      await fetch(`/api/checklists/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedItems: newCompleted }),
      });
    } catch {
      // Revert on error
      setCompletedItems(completedItems);
      addToast('Erro ao atualizar checklist', 'error');
    }
  }, [post, completedItems, addToast]);

  // Analyze with AI
  const analyzeWithAi = useCallback(async () => {
    if (!post) return;
    setAnalyzingAi(true);
    setAiAnalysis(null);

    try {
      const hookValue = frameworkValues.hook || frameworkValues.cover || '';
      const res = await fetch('/api/ai/analyze-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          hook: hookValue,
          caption,
          format: post.format,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to analyze');
      }

      const data = await res.json() as {
        onlyIvanScore: number;
        analysis: string;
        suggestion: string;
      };
      setAiAnalysis(data);
      addToast('Análise concluída!', 'success');
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Erro ao analisar com IA',
        'error'
      );
    } finally {
      setAnalyzingAi(false);
    }
  }, [post, title, caption, frameworkValues, addToast]);

  // Framework
  const format = post?.format as PostFormat;
  const framework = format ? FRAMEWORKS[format] : null;
  const pillar = pillars.find((p) => p.id === post?.pillarId);

  // Hashtag suggestions
  const hashtagSuggestions = getHashtagSuggestions(pillar?.slug);

  const handleFieldChange = useCallback((key: string, value: string) => {
    setFrameworkValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const addHashtag = useCallback((tag: string) => {
    setHashtags((prev) => {
      if (prev.includes(tag)) return prev;
      return prev ? `${prev} ${tag}` : tag;
    });
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="skeleton h-6 w-72 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="skeleton h-10 w-full" />
            <div className="skeleton h-40 w-full" />
            <div className="skeleton h-40 w-full" />
          </div>
          <div className="space-y-4">
            <div className="skeleton h-60 w-full" />
            <div className="skeleton h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!post || !framework) {
    return null;
  }

  const currentStatusIndex = STATUS_ORDER.indexOf(post.status as PostStatus);
  const canAdvance = currentStatusIndex < STATUS_ORDER.length - 1;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-text-tertiary mb-6">
        <Link href="/" className="hover:text-text-primary transition-colors">
          Dashboard
        </Link>
        <ChevronRight size={12} />
        <Link href="/pipeline" className="hover:text-text-primary transition-colors">
          Pipeline
        </Link>
        <ChevronRight size={12} />
        <span className="text-text-primary font-medium truncate max-w-[200px]">
          {post.title}
        </span>
      </nav>

      {/* Title & Actions */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-heading-1 text-text-primary bg-transparent border-none outline-none flex-1 placeholder:text-text-tertiary"
          placeholder="Título do post..."
        />

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={analyzeWithAi}
            disabled={analyzingAi}
            className="btn-ghost flex items-center gap-2 text-xs"
          >
            {analyzingAi ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Brain size={14} />
                Analisar IA
              </>
            )}
          </button>
          <button
            onClick={() => savePost(false)}
            disabled={saving}
            className="btn-ghost flex items-center gap-2 text-xs"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={14} />
                Salvar
              </>
            )}
          </button>

          {canAdvance && (
            <button
              onClick={advanceStatus}
              disabled={advancing}
              className="btn-accent flex items-center gap-2 text-xs"
            >
              {advancing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Avançando...
                </>
              ) : (
                <>
                  <ArrowRight size={14} />
                  Avançar para {STATUS_LABELS[STATUS_ORDER[currentStatusIndex + 1]]}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Framework Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Framework Fields */}
          <div className="card p-6">
            <FrameworkEditor
              framework={framework}
              values={frameworkValues}
              onChange={handleFieldChange}
            />
          </div>

          {/* Caption & Hashtags (for all formats) */}
          <div className="card p-6 space-y-4">
            <div>
              <label htmlFor="post-caption" className="text-label text-text-secondary mb-1.5 block">
                Legenda
              </label>
              <textarea
                id="post-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Legenda do post para o Instagram..."
                className="input min-h-[100px] resize-y"
              />
            </div>

            <div>
              <label htmlFor="post-hashtags" className="text-label text-text-secondary mb-1.5 block">
                Hashtags
              </label>
              <input
                id="post-hashtags"
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#ecommerce #marketingdigital"
                className="input"
              />

              {/* Hashtag Suggestions */}
              {hashtagSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {hashtagSuggestions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addHashtag(tag)}
                      className={cn(
                        'badge text-[10px] cursor-pointer transition-all',
                        hashtags.includes(tag)
                          ? 'bg-accent-surface text-accent'
                          : 'bg-bg-secondary text-text-tertiary hover:bg-bg-hover hover:text-text-secondary'
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reference Link */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-heading-3 text-text-primary">Link de Referência</h3>
            </div>
            <input
              id="post-reference-link"
              type="url"
              value={referenceLink}
              onChange={(e) => setReferenceLink(e.target.value)}
              placeholder="https://exemplo.com/conteudo-para-modelar"
              className="input w-full"
            />
            {referenceLink && (
              <a
                href={referenceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-2"
              >
                Abrir link ↗
              </a>
            )}
          </div>

          {/* Script & Production Notes */}
          <div className="card p-6 space-y-4">
            <h3 className="text-heading-3 text-text-primary">Roteiro & Produção</h3>

            <div>
              <label htmlFor="post-script" className="text-label text-text-secondary mb-1.5 block">
                Roteiro
              </label>
              <textarea
                id="post-script"
                value={post.script || ''}
                onChange={(e) => setPost((p) => p ? { ...p, script: e.target.value } : p)}
                placeholder="Cole ou escreva o roteiro aqui..."
                className="input min-h-[120px] resize-y font-mono text-sm"
                rows={5}
              />
            </div>

            <div>
              <label htmlFor="post-production-notes" className="text-label text-text-secondary mb-1.5 block">
                Notas de Produção
              </label>
              <textarea
                id="post-production-notes"
                value={post.productionNotes || ''}
                onChange={(e) => setPost((p) => p ? { ...p, productionNotes: e.target.value } : p)}
                placeholder="Locação, equipamentos, figurino, props..."
                className="input min-h-[60px] resize-y"
                rows={2}
              />
            </div>
          </div>

          {/* Strategy: Purpose, Audience, Only Ivan */}
          <div className="card p-6 space-y-4">
            <h3 className="text-heading-3 text-text-primary">Estratégia</h3>

            <div>
              <label htmlFor="post-purpose" className="text-label text-text-secondary mb-1.5 block">
                Que mudança eu quero criar com esse post?
              </label>
              <textarea
                id="post-purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Ex: Fazer donos de e-commerce entenderem que precisam de tráfego pago estratégico"
                className="input min-h-[60px] resize-y"
                rows={2}
              />
            </div>

            <div>
              <label htmlFor="post-audience" className="text-label text-text-secondary mb-1.5 block">
                Para quem ESPECIFICAMENTE?
              </label>
              <textarea
                id="post-audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Ex: Donos de e-commerce de moda com faturamento entre 50k-200k/mês"
                className="input min-h-[60px] resize-y"
                rows={2}
              />
            </div>

            <label
              htmlFor="post-only-ivan-editor"
              className="flex items-center gap-3 rounded-lg border border-border-default bg-bg-primary px-4 py-3 cursor-pointer transition-all hover:border-border-strong"
            >
              <input
                id="post-only-ivan-editor"
                type="checkbox"
                checked={onlyIvan}
                onChange={(e) => setOnlyIvan(e.target.checked)}
                className="h-4 w-4 rounded accent-accent"
              />
              <div>
                <p className="text-sm font-medium text-text-primary">Só o Ivan poderia ter criado isso?</p>
                <p className="text-[11px] text-text-tertiary">Marque se este conteúdo tem a sua assinatura única</p>
              </div>
            </label>
          </div>

          {/* AI Analysis Result */}
          {aiAnalysis && (
            <div className="card p-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={16} className="text-accent" />
                <h3 className="text-heading-3 text-text-primary">Análise IA</h3>
              </div>

              {/* Score */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold"
                    style={{
                      backgroundColor: aiAnalysis.onlyIvanScore >= 7
                        ? 'rgba(184, 255, 0, 0.15)'
                        : aiAnalysis.onlyIvanScore >= 4
                          ? 'rgba(255, 214, 10, 0.15)'
                          : 'rgba(255, 69, 58, 0.15)',
                      color: aiAnalysis.onlyIvanScore >= 7
                        ? '#B8FF00'
                        : aiAnalysis.onlyIvanScore >= 4
                          ? '#FFD60A'
                          : '#FF453A',
                    }}
                  >
                    {aiAnalysis.onlyIvanScore}
                  </div>
                  <p className="text-[10px] text-text-tertiary mt-1">Só Ivan</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-text-primary">{aiAnalysis.analysis}</p>
                </div>
              </div>

              {/* Suggestion */}
              <div className="rounded-lg bg-accent-surface p-3">
                <p className="text-xs font-semibold text-accent mb-1">Sugestão de melhoria</p>
                <p className="text-xs text-text-primary">{aiAnalysis.suggestion}</p>
              </div>
            </div>
          )}

          {/* Stage Checklist (Story 2.4) */}
          {checklistTemplateItems.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-heading-3 text-text-primary">
                  Checklist: {STATUS_LABELS[post.status as PostStatus]}
                </h3>
                <span className="text-xs text-text-tertiary">
                  {completedItems.length}/{checklistTemplateItems.length} concluídos
                </span>
              </div>

              {checklistLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="skeleton h-8 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {checklistTemplateItems.map((item) => {
                    const isChecked = completedItems.includes(item);
                    return (
                      <label
                        key={item}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors',
                          isChecked
                            ? 'bg-success-surface'
                            : 'bg-bg-secondary hover:bg-bg-hover'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleChecklistItem(item)}
                          className="h-4 w-4 rounded accent-accent"
                        />
                        <span
                          className={cn(
                            'text-sm',
                            isChecked
                              ? 'text-text-tertiary line-through'
                              : 'text-text-primary'
                          )}
                        >
                          {item}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Warning if trying to advance */}
              {completedItems.length < checklistTemplateItems.length && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-warning-surface px-3 py-2">
                  <AlertTriangle size={14} className="text-warning shrink-0" />
                  <p className="text-xs text-warning">
                    Complete todos os itens antes de avançar o status.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Preview & Sidebar */}
        <div className="space-y-6">
          <PostSidebar post={post} pillar={pillar} />

          <ContentPreview
            framework={framework}
            values={frameworkValues}
            title={title}
            pillarColor={pillar?.color || '#6E6E73'}
            pillarName={pillar?.name || 'Sem pilar'}
          />
        </div>
      </div>
    </div>
  );
}
