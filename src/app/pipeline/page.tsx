'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Filter, Kanban, List, Film, LayoutGrid, Image, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/stores/toast-store';
import PipelineColumn from '@/components/pipeline/pipeline-column';
import PipelineCard from '@/components/pipeline/pipeline-card';
import type { Post, PostStatus, PostFormat, ContentPillar } from '@/types';
import { STATUS_ORDER, STATUS_LABELS, FORMAT_LABELS } from '@/types';

type EditingStatus = 'Pendente' | 'Em edicao' | 'Pronto';

const EDITING_OPTIONS: EditingStatus[] = ['Pendente', 'Em edicao', 'Pronto'];

const EDITING_COLORS: Record<EditingStatus, { bg: string; text: string }> = {
  'Pendente': { bg: 'bg-[rgba(110,110,115,0.1)]', text: 'text-text-tertiary' },
  'Em edicao': { bg: 'bg-[rgba(217,119,6,0.1)]', text: 'text-[#D97706]' },
  'Pronto': { bg: 'bg-[rgba(22,163,106,0.1)]', text: 'text-[#16A34A]' },
};

const STATUS_COLORS: Record<PostStatus, string> = {
  IDEA: '#6E6E73',
  SCRIPT: '#7C3AED',
  PRODUCTION: '#2563EB',
  REVIEW: '#D97706',
  SCHEDULED: '#16A34A',
  PUBLISHED: '#4A7A00',
};

const FORMAT_ICONS: Record<PostFormat, React.ReactNode> = {
  REEL: <Film size={14} />,
  CAROUSEL: <LayoutGrid size={14} />,
  STATIC: <Image size={14} />,
  STORY: <MessageCircle size={14} />,
};

function getEditingStatuses(): Record<string, EditingStatus> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('pipeline-editing-statuses');
    if (stored) return JSON.parse(stored) as Record<string, EditingStatus>;
  } catch {
    // ignore parse errors
  }
  return {};
}

function saveEditingStatuses(statuses: Record<string, EditingStatus>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('pipeline-editing-statuses', JSON.stringify(statuses));
  } catch {
    // ignore storage errors
  }
}

export default function PipelinePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('table');
  const [editingStatuses, setEditingStatuses] = useState<Record<string, EditingStatus>>({});

  // Filters
  const [filterPillar, setFilterPillar] = useState<string>('');
  const [filterAssigned, setFilterAssigned] = useState<string>('');
  const [filterFormat, setFilterFormat] = useState<string>('');

  const { addToast } = useToastStore();
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Load editing statuses from localStorage on mount
  useEffect(() => {
    setEditingStatuses(getEditingStatuses());
  }, []);

  const handleEditingChange = useCallback((postId: string, status: EditingStatus) => {
    setEditingStatuses((prev) => {
      const next = { ...prev, [postId]: status };
      saveEditingStatuses(next);
      return next;
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [postsRes, pillarsRes] = await Promise.all([
        fetch('/api/posts'),
        fetch('/api/pillars'),
      ]);

      if (!postsRes.ok) throw new Error('Failed to fetch posts');
      if (!pillarsRes.ok) throw new Error('Failed to fetch pillars');

      const postsData = await postsRes.json() as Post[];
      const pillarsData = await pillarsRes.json() as ContentPillar[];

      setPosts(postsData);
      setPillars(pillarsData);
    } catch (error) {
      console.error('Failed to fetch pipeline data:', error instanceof Error ? error.message : 'Unknown');
      addToast('Erro ao carregar pipeline', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get unique assignees from posts
  const assignees = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.assignedTo) set.add(p.assignedTo);
    });
    return Array.from(set).sort();
  }, [posts]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (filterPillar && post.pillarId !== filterPillar) return false;
      if (filterAssigned && post.assignedTo !== filterAssigned) return false;
      if (filterFormat && post.format !== filterFormat) return false;
      return true;
    });
  }, [posts, filterPillar, filterAssigned, filterFormat]);

  // Group posts by status
  const postsByStatus = useMemo(() => {
    const grouped: Record<PostStatus, Post[]> = {
      IDEA: [],
      SCRIPT: [],
      PRODUCTION: [],
      REVIEW: [],
      SCHEDULED: [],
      PUBLISHED: [],
    };

    filteredPosts.forEach((post) => {
      const status = post.status as PostStatus;
      if (grouped[status]) {
        grouped[status].push(post);
      }
    });

    return grouped;
  }, [filteredPosts]);

  const handlePostClick = useCallback((post: Post) => {
    router.push(`/posts/${post.id}`);
  }, [router]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const post = posts.find((p) => p.id === event.active.id);
    if (post) setActivePost(post);
  }, [posts]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActivePost(null);

    const { active, over } = event;
    if (!over) return;

    const postId = active.id as string;
    const newStatus = over.id as PostStatus;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    // Don't do anything if dropped on same column
    if (post.status === newStatus) return;

    // Don't allow moving published posts
    if (post.status === 'PUBLISHED') {
      addToast('Posts publicados nao podem ser movidos', 'error');
      return;
    }

    const oldStatus = post.status;

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, status: newStatus, updatedAt: new Date().toISOString() } : p
      )
    );

    try {
      const res = await fetch(`/api/posts/${postId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        // Revert on failure
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, status: oldStatus } : p
          )
        );
        addToast('Erro ao mover post. Tente novamente.', 'error');
      } else {
        addToast('Status atualizado!', 'success');
      }
    } catch {
      // Revert on error
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, status: oldStatus } : p
        )
      );
      addToast('Erro ao mover post. Tente novamente.', 'error');
    }
  }, [posts, addToast]);

  const hasActiveFilters = filterPillar || filterAssigned || filterFormat;

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="skeleton h-4 w-64 mb-8" />
        <div className="flex gap-4 overflow-x-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton min-w-[260px] h-[400px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-heading-1 text-text-primary mb-1">Pipeline</h1>
          <p className="text-sm text-text-secondary">
            {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} no pipeline
          </p>
        </div>

        {/* View toggle - desktop only */}
        <div className="hidden md:flex items-center gap-1 bg-bg-secondary rounded-lg p-1">
          <button
            onClick={() => setViewMode('table')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              viewMode === 'table'
                ? 'bg-bg-card text-text-primary shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary'
            )}
          >
            <List size={14} />
            Tabela
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              viewMode === 'kanban'
                ? 'bg-bg-card text-text-primary shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary'
            )}
          >
            <Kanban size={14} />
            Kanban
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-3 mb-6 flex items-center gap-3 flex-wrap">
        <Filter size={14} className="text-text-tertiary shrink-0" />

        {/* Pillar filter */}
        <select
          value={filterPillar}
          onChange={(e) => setFilterPillar(e.target.value)}
          className={cn(
            'input py-1.5 px-3 text-xs w-auto min-w-[140px]',
            filterPillar && 'border-accent'
          )}
        >
          <option value="">Todos os pilares</option>
          {pillars.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Assignee filter */}
        <select
          value={filterAssigned}
          onChange={(e) => setFilterAssigned(e.target.value)}
          className={cn(
            'input py-1.5 px-3 text-xs w-auto min-w-[140px]',
            filterAssigned && 'border-accent'
          )}
        >
          <option value="">Todos os responsaveis</option>
          {assignees.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        {/* Format filter */}
        <select
          value={filterFormat}
          onChange={(e) => setFilterFormat(e.target.value)}
          className={cn(
            'input py-1.5 px-3 text-xs w-auto min-w-[120px]',
            filterFormat && 'border-accent'
          )}
        >
          <option value="">Todos os formatos</option>
          <option value="REEL">Reel</option>
          <option value="CAROUSEL">Carrossel</option>
          <option value="STATIC">Post</option>
          <option value="STORY">Story</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setFilterPillar('');
              setFilterAssigned('');
              setFilterFormat('');
            }}
            className="text-xs text-accent hover:text-accent-hover font-medium transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Desktop Table View */}
      {viewMode === 'table' && (
        <div className="hidden md:block">
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-default bg-bg-secondary">
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-text-tertiary px-4 py-3">
                      Titulo
                    </th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-text-tertiary px-3 py-3 w-[100px]">
                      Formato
                    </th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-text-tertiary px-3 py-3 w-[130px]">
                      Pilar
                    </th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-text-tertiary px-3 py-3 w-[120px]">
                      Status
                    </th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-text-tertiary px-3 py-3 w-[140px]">
                      Edicao
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post) => {
                    const pillarColor = post.pillar?.color || '#6E6E73';
                    const statusColor = STATUS_COLORS[post.status as PostStatus] || '#6E6E73';
                    const editStatus = editingStatuses[post.id] || 'Pendente';
                    const editColors = EDITING_COLORS[editStatus];

                    return (
                      <tr
                        key={post.id}
                        className="border-b border-border-default last:border-0 hover:bg-bg-hover transition-colors group"
                      >
                        {/* Title */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handlePostClick(post)}
                            className="text-left w-full"
                          >
                            <p className="text-sm font-medium text-text-primary truncate max-w-[400px] group-hover:text-accent transition-colors">
                              {post.title}
                            </p>
                            {(post.assignedTo || post.scheduledDate) && (
                              <p className="text-[11px] text-text-tertiary mt-0.5">
                                {post.assignedTo && <span>{post.assignedTo}</span>}
                                {post.assignedTo && post.scheduledDate && <span> - </span>}
                                {post.scheduledDate && (
                                  <span>
                                    {new Date(post.scheduledDate).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: 'short',
                                    })}
                                  </span>
                                )}
                              </p>
                            )}
                          </button>
                        </td>

                        {/* Format */}
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                            {FORMAT_ICONS[post.format as PostFormat]}
                            {FORMAT_LABELS[post.format as PostFormat] || post.format}
                          </span>
                        </td>

                        {/* Pillar */}
                        <td className="px-3 py-3">
                          <span
                            className="badge text-[11px] px-2 py-0.5"
                            style={{
                              backgroundColor: `${pillarColor}15`,
                              color: pillarColor,
                            }}
                          >
                            {post.pillar?.name || 'Sem pilar'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3">
                          <span
                            className="badge text-[11px] px-2 py-0.5 font-medium"
                            style={{
                              backgroundColor: `${statusColor}15`,
                              color: statusColor,
                            }}
                          >
                            {STATUS_LABELS[post.status as PostStatus] || post.status}
                          </span>
                        </td>

                        {/* Editing Status */}
                        <td className="px-3 py-3">
                          <select
                            value={editStatus}
                            onChange={(e) => handleEditingChange(post.id, e.target.value as EditingStatus)}
                            className={cn(
                              'text-[11px] font-medium px-2 py-1 rounded-md border-0 cursor-pointer transition-colors',
                              editColors.bg,
                              editColors.text
                            )}
                          >
                            {EDITING_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPosts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-sm text-text-tertiary">
                        Nenhum post encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Kanban View */}
      {viewMode === 'kanban' && (
        <div className="hidden md:block">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {STATUS_ORDER.map((status) => (
                <PipelineColumn
                  key={status}
                  status={status}
                  posts={postsByStatus[status]}
                  onPostClick={handlePostClick}
                />
              ))}
            </div>

            <DragOverlay>
              {activePost ? (
                <div className="w-[240px]">
                  <PipelineCard
                    post={activePost}
                    daysInColumn={0}
                    onClick={() => {}}
                    isDragging
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {STATUS_ORDER.map((status) => {
          const statusPosts = postsByStatus[status];
          if (statusPosts.length === 0) return null;

          const statusColor = STATUS_COLORS[status];

          return (
            <div key={status}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: statusColor }}
                />
                <h3 className="text-xs font-semibold text-text-primary">
                  {STATUS_LABELS[status]}
                </h3>
                <span
                  className="badge text-[10px] px-2 py-0.5"
                  style={{
                    backgroundColor: `${statusColor}15`,
                    color: statusColor,
                  }}
                >
                  {statusPosts.length}
                </span>
              </div>

              <div className="space-y-2">
                {statusPosts.map((post) => {
                  const pillarColor = post.pillar?.color || '#6E6E73';
                  const editStatus = editingStatuses[post.id] || 'Pendente';
                  const editColors = EDITING_COLORS[editStatus];

                  return (
                    <button
                      key={post.id}
                      onClick={() => handlePostClick(post)}
                      className="w-full text-left card p-3 hover:border-border-strong transition-all"
                      style={{ borderLeft: `3px solid ${pillarColor}` }}
                    >
                      <p className="text-sm font-medium text-text-primary line-clamp-2 mb-2">
                        {post.title}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
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
                        <span
                          className={cn(
                            'badge text-[10px] px-1.5 py-0.5',
                            editColors.bg,
                            editColors.text
                          )}
                        >
                          {editStatus}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredPosts.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-sm text-text-tertiary">Nenhum post encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
