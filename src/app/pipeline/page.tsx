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
import { Filter, Kanban } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/stores/toast-store';
import PipelineColumn from '@/components/pipeline/pipeline-column';
import PipelineCard from '@/components/pipeline/pipeline-card';
import type { Post, PostStatus, ContentPillar } from '@/types';
import { STATUS_ORDER, STATUS_LABELS } from '@/types';

const STATUS_COLORS: Record<PostStatus, string> = {
  IDEA: '#6E6E73',
  SCRIPT: '#7C3AED',
  PRODUCTION: '#2563EB',
  REVIEW: '#D97706',
  SCHEDULED: '#16A34A',
  PUBLISHED: '#4A7A00',
};

export default function PipelinePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePost, setActivePost] = useState<Post | null>(null);

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

  // Group posts by status (SCRIPT posts go into IDEA)
  const postsByStatus = useMemo(() => {
    const grouped: Record<string, Post[]> = {};
    for (const s of STATUS_ORDER) {
      grouped[s] = [];
    }

    filteredPosts.forEach((post) => {
      const status = post.status as PostStatus;
      if (status === 'SCRIPT') {
        grouped['IDEA'].push(post);
      } else if (grouped[status]) {
        grouped[status].push(post);
      }
    });

    return grouped as Record<PostStatus, Post[]>;
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

        <div className="hidden md:flex items-center gap-1.5 text-text-tertiary">
          <Kanban size={16} />
          <span className="text-xs font-medium">Kanban</span>
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

      {/* Desktop Kanban View */}
      <div className="hidden md:block">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid gap-3 pb-4" style={{ gridTemplateColumns: `repeat(${STATUS_ORDER.length}, minmax(0, 1fr))` }}>
              {STATUS_ORDER.map((status) => (
                <PipelineColumn
                  key={status}
                  status={status}
                  posts={postsByStatus[status] || []}
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
                        {post.assignedTo && (
                          <span className="text-[10px] text-text-tertiary">
                            {post.assignedTo}
                          </span>
                        )}
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
