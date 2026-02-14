'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Play,
  CheckCircle,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Film,
  LayoutGrid,
  Image,
  MessageCircle,
  Calendar,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { useBatchStore } from '@/stores/batch-store';
import { useToastStore } from '@/stores/toast-store';
import type { Post, PostFormat, BatchStatus } from '@/types';
import { FORMAT_LABELS } from '@/types';

interface BatchSessionDetailProps {
  sessionId: string;
  onBack: () => void;
}

const FORMAT_ICONS: Record<PostFormat, React.ReactNode> = {
  REEL: <Film size={12} />,
  CAROUSEL: <LayoutGrid size={12} />,
  STATIC: <Image size={12} />,
  STORY: <MessageCircle size={12} />,
};

const STATUS_LABELS: Record<BatchStatus, string> = {
  PLANNED: 'Planejada',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluida',
};

export default function BatchSessionDetail({ sessionId, onBack }: BatchSessionDetailProps) {
  const { selectedSession, fetchSession, updateSessionStatus, addPostToSession, removePostFromSession } = useBatchStore();
  const { addToast } = useToastStore();

  const [availablePosts, setAvailablePosts] = useState<Post[]>([]);
  const [selectedPostId, setSelectedPostId] = useState('');
  const [showCompleteOptions, setShowCompleteOptions] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchSession(sessionId);
      setLoading(false);
    };
    load();
  }, [sessionId, fetchSession]);

  // Fetch available posts (SCRIPT or PRODUCTION status)
  const fetchAvailablePosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts');
      if (!res.ok) return;
      const posts = await res.json() as Post[];
      const filtered = posts.filter(
        (p) => p.status === 'SCRIPT' || p.status === 'PRODUCTION'
      );
      setAvailablePosts(filtered);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchAvailablePosts();
  }, [fetchAvailablePosts]);

  const handleAddPost = useCallback(async () => {
    if (!selectedPostId) return;

    const success = await addPostToSession(sessionId, selectedPostId);
    if (success) {
      addToast('Post adicionado a sessao!', 'success');
      setSelectedPostId('');
      fetchAvailablePosts();
    } else {
      addToast('Post ja esta nesta sessao ou erro ao adicionar.', 'error');
    }
  }, [selectedPostId, sessionId, addPostToSession, addToast, fetchAvailablePosts]);

  const handleRemovePost = useCallback(async (postId: string) => {
    const success = await removePostFromSession(sessionId, postId);
    if (success) {
      addToast('Post removido da sessao.', 'success');
    } else {
      addToast('Erro ao remover post.', 'error');
    }
  }, [sessionId, removePostFromSession, addToast]);

  const handleStartSession = useCallback(async () => {
    const success = await updateSessionStatus(sessionId, 'IN_PROGRESS');
    if (success) {
      addToast('Sessao iniciada!', 'success');
    } else {
      addToast('Erro ao iniciar sessao.', 'error');
    }
  }, [sessionId, updateSessionStatus, addToast]);

  const handleCompleteSession = useCallback(async (advanceStatus?: string) => {
    const success = await updateSessionStatus(sessionId, 'COMPLETED', advanceStatus);
    if (success) {
      addToast(
        advanceStatus
          ? `Sessao concluida! Posts movidos para ${advanceStatus === 'PRODUCTION' ? 'Producao' : 'Revisao'}.`
          : 'Sessao concluida!',
        'success'
      );
      setShowCompleteOptions(false);
    } else {
      addToast('Erro ao concluir sessao.', 'error');
    }
  }, [sessionId, updateSessionStatus, addToast]);

  if (loading || !selectedSession) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="skeleton h-4 w-64 mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      </div>
    );
  }

  const sessionPosts = selectedSession.posts || [];
  const isPlanned = selectedSession.status === 'PLANNED';
  const isInProgress = selectedSession.status === 'IN_PROGRESS';
  const isCompleted = selectedSession.status === 'COMPLETED';

  // Filter out posts already in the session from available posts
  const sessionPostIds = new Set(sessionPosts.map((sp) => sp.postId));
  const filteredAvailable = availablePosts.filter((p) => !sessionPostIds.has(p.id));

  return (
    <div className="animate-fade-in">
      {/* Back button + header */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-heading-1 text-text-primary mb-1">
            {selectedSession.title}
          </h2>
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(selectedSession.scheduledDate)}
            </span>
            <span className={cn(
              'badge text-[10px]',
              isPlanned && 'bg-info-surface text-info',
              isInProgress && 'bg-warning-surface text-warning',
              isCompleted && 'bg-success-surface text-success'
            )}>
              {STATUS_LABELS[selectedSession.status as BatchStatus]}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {isPlanned && (
            <button
              onClick={handleStartSession}
              className="btn-accent flex items-center gap-2 text-xs"
              disabled={sessionPosts.length === 0}
            >
              <Play size={14} />
              Iniciar Sessao
            </button>
          )}

          {isInProgress && (
            <div className="relative">
              <button
                onClick={() => setShowCompleteOptions(!showCompleteOptions)}
                className="btn-accent flex items-center gap-2 text-xs"
              >
                <CheckCircle size={14} />
                Concluir Sessao
              </button>

              {showCompleteOptions && (
                <div className="absolute right-0 top-full mt-2 bg-bg-card border border-border-default rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-2 min-w-[220px] z-10 animate-scale-in">
                  <button
                    onClick={() => handleCompleteSession('PRODUCTION')}
                    className="w-full text-left px-3 py-2 text-xs rounded-[var(--radius-sm)] hover:bg-bg-hover transition-colors text-text-primary"
                  >
                    Concluir e mover para Producao
                  </button>
                  <button
                    onClick={() => handleCompleteSession('REVIEW')}
                    className="w-full text-left px-3 py-2 text-xs rounded-[var(--radius-sm)] hover:bg-bg-hover transition-colors text-text-primary"
                  >
                    Concluir e mover para Revisao
                  </button>
                  <button
                    onClick={() => handleCompleteSession()}
                    className="w-full text-left px-3 py-2 text-xs rounded-[var(--radius-sm)] hover:bg-bg-hover transition-colors text-text-secondary"
                  >
                    Apenas concluir (sem mover posts)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {selectedSession.notes && (
        <div className="card p-4 mb-6">
          <p className="text-label text-text-tertiary mb-1">Notas</p>
          <p className="text-sm text-text-secondary">{selectedSession.notes}</p>
        </div>
      )}

      {/* Add post to session (only if not completed) */}
      {!isCompleted && (
        <div className="card p-4 mb-6">
          <p className="text-label text-text-tertiary mb-2">Adicionar Post</p>
          <div className="flex items-center gap-2">
            <select
              value={selectedPostId}
              onChange={(e) => setSelectedPostId(e.target.value)}
              className="input flex-1 text-xs"
            >
              <option value="">Selecione um post (Script ou Producao)...</option>
              {filteredAvailable.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({FORMAT_LABELS[p.format as PostFormat]})
                </option>
              ))}
            </select>
            <button
              onClick={handleAddPost}
              disabled={!selectedPostId}
              className="btn-accent flex items-center gap-1 text-xs py-2 px-3"
            >
              <Plus size={14} />
              Adicionar
            </button>
          </div>
          {filteredAvailable.length === 0 && (
            <p className="text-xs text-text-tertiary mt-2 italic">
              Nenhum post com status Script ou Producao disponivel.
            </p>
          )}
        </div>
      )}

      {/* Posts list */}
      <div>
        <p className="text-label text-text-tertiary mb-3">
          Posts na Sessao ({sessionPosts.length})
        </p>

        {sessionPosts.length === 0 ? (
          <div className="card p-8 flex flex-col items-center justify-center text-center">
            <p className="text-sm text-text-secondary mb-1">Nenhum post adicionado</p>
            <p className="text-xs text-text-tertiary">
              Adicione posts com status Script ou Producao para esta sessao.
            </p>
          </div>
        ) : (
          <div className="space-y-2 stagger-children">
            {sessionPosts.map((sp, index) => {
              const post = sp.post;
              const pillarColor = post.pillar?.color || '#6E6E73';

              return (
                <div
                  key={sp.id}
                  className="card p-3 flex items-center gap-3"
                  style={{ borderLeft: `3px solid ${pillarColor}` }}
                >
                  {/* Order number */}
                  <span className="text-xs font-bold text-text-tertiary w-6 text-center shrink-0">
                    {index + 1}
                  </span>

                  {/* Post info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="badge text-[10px]"
                        style={{
                          backgroundColor: `${pillarColor}15`,
                          color: pillarColor,
                        }}
                      >
                        {post.pillar?.name || 'Sem pilar'}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-text-tertiary">
                        {FORMAT_ICONS[post.format as PostFormat]}
                        {FORMAT_LABELS[post.format as PostFormat]}
                      </span>
                    </div>
                  </div>

                  {/* Reorder + Remove buttons */}
                  {!isCompleted && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        disabled={index === 0}
                        className={cn(
                          'p-1 rounded-[var(--radius-sm)] hover:bg-bg-hover transition-colors text-text-tertiary',
                          index === 0 && 'opacity-30 cursor-not-allowed'
                        )}
                        title="Mover para cima"
                        onClick={() => {
                          // Reorder handled via visual feedback only -- swap in-memory
                          // Real reorder would require API endpoint; using visual order for now
                        }}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        disabled={index === sessionPosts.length - 1}
                        className={cn(
                          'p-1 rounded-[var(--radius-sm)] hover:bg-bg-hover transition-colors text-text-tertiary',
                          index === sessionPosts.length - 1 && 'opacity-30 cursor-not-allowed'
                        )}
                        title="Mover para baixo"
                        onClick={() => {
                          // Same as above
                        }}
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        onClick={() => handleRemovePost(sp.postId)}
                        className="p-1 rounded-[var(--radius-sm)] hover:bg-error-surface transition-colors text-text-tertiary hover:text-error"
                        title="Remover"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
