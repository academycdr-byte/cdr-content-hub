'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useRouter } from 'next/navigation';
import { usePostsStore } from '@/stores/posts-store';
import { useToastStore } from '@/stores/toast-store';
import CalendarHeader from '@/components/calendar/calendar-header';
import CalendarDndGrid from '@/components/calendar/calendar-dnd-grid';
import CalendarPostCard from '@/components/calendar/calendar-post-card';
import dynamic from 'next/dynamic';
import type { CreatePostData } from '@/components/posts/create-post-modal';

const CreatePostModal = dynamic(() => import('@/components/posts/create-post-modal'), { ssr: false });
import type { Post } from '@/types';

export default function CalendarPage() {
  const {
    posts,
    pillars,
    loading,
    currentMonth,
    currentYear,
    setMonth,
    fetchPosts,
    fetchPillars,
    updatePost,
    removePost,
  } = usePostsStore();

  const { addToast } = useToastStore();
  const router = useRouter();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activePost, setActivePost] = useState<Post | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch planned posts
  useEffect(() => {
    fetchPillars();
    fetchPosts(currentYear, currentMonth);
  }, [fetchPillars, fetchPosts, currentYear, currentMonth]);

  const handlePrevMonth = useCallback(() => {
    const newMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const newYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    setMonth(newYear, newMonth);
  }, [currentMonth, currentYear, setMonth]);

  const handleNextMonth = useCallback(() => {
    const newMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const newYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    setMonth(newYear, newMonth);
  }, [currentMonth, currentYear, setMonth]);

  const handleToday = useCallback(() => {
    const now = new Date();
    setMonth(now.getFullYear(), now.getMonth());
  }, [setMonth]);

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setShowCreateModal(true);
  }, []);

  const handleNewPost = useCallback(() => {
    setSelectedDate(null);
    setShowCreateModal(true);
  }, []);

  const handlePostClick = useCallback((post: Post) => {
    router.push(`/posts/${post.id}`);
  }, [router]);

  const handleCreatePost = useCallback(async (data: CreatePostData) => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to create post');

    const newPost = await res.json() as Post;
    usePostsStore.getState().addPost(newPost);
    addToast('Post planejado com sucesso!', 'success');
  }, [addToast]);

  const handleDeletePost = useCallback(async (post: Post) => {
    const confirmed = window.confirm(`Remover "${post.title}" do planejamento?`);
    if (!confirmed) return;

    // Optimistic removal
    removePost(post.id);

    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (!res.ok) {
        // Revert on failure
        usePostsStore.getState().addPost(post);
        addToast('Erro ao remover post. Tente novamente.', 'error');
      } else {
        addToast('Post removido com sucesso!', 'success');
      }
    } catch {
      usePostsStore.getState().addPost(post);
      addToast('Erro ao remover post. Tente novamente.', 'error');
    }
  }, [removePost, addToast]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const post = posts.find((p) => p.id === event.active.id);
    if (post) setActivePost(post);
  }, [posts]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActivePost(null);

    const { active, over } = event;
    if (!over) return;

    const postId = active.id as string;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    // Don't allow dragging published posts
    if (post.status === 'PUBLISHED') {
      addToast('Posts publicados não podem ser movidos', 'error');
      return;
    }

    const newDate = over.id as string; // format: YYYY-MM-DD

    // Optimistic update
    updatePost(postId, { scheduledDate: newDate });

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledDate: newDate }),
      });

      if (!res.ok) {
        // Revert on failure
        updatePost(postId, { scheduledDate: post.scheduledDate });
        addToast('Erro ao mover post. Tente novamente.', 'error');
      } else {
        addToast('Post movido com sucesso!', 'success');
      }
    } catch {
      updatePost(postId, { scheduledDate: post.scheduledDate });
      addToast('Erro ao mover post. Tente novamente.', 'error');
    }
  }, [posts, updatePost, addToast]);

  // Planning summary stats
  const totalPlanned = posts.length;
  const byFormat: Record<string, number> = {};
  const byPillar: Record<string, { name: string; color: string; count: number }> = {};

  for (const post of posts) {
    byFormat[post.format] = (byFormat[post.format] || 0) + 1;
    if (post.pillar) {
      if (!byPillar[post.pillar.id]) {
        byPillar[post.pillar.id] = { name: post.pillar.name, color: post.pillar.color, count: 0 };
      }
      byPillar[post.pillar.id].count += 1;
    }
  }

  const FORMAT_LABELS: Record<string, string> = {
    REEL: 'Reels',
    CAROUSEL: 'Carrossel',
    STATIC: 'Imagem',
    STORY: 'Story',
  };

  return (
    <div className="max-w-full animate-fade-in">
      <CalendarHeader
        year={currentYear}
        month={currentMonth}
        posts={posts}
        pillars={pillars}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        onNewPost={handleNewPost}
      />

      {/* Planning Summary */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">{totalPlanned}</span> post{totalPlanned !== 1 ? 's' : ''} planejado{totalPlanned !== 1 ? 's' : ''} no mês
          </span>
          {Object.entries(byFormat).length > 0 && (
            <div className="flex items-center gap-2">
              {Object.entries(byFormat).map(([format, count]) => (
                <span
                  key={format}
                  className="badge text-[10px] bg-bg-secondary text-text-secondary"
                >
                  {FORMAT_LABELS[format] || format}: {count}
                </span>
              ))}
            </div>
          )}
        </div>
        {Object.entries(byPillar).length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {Object.values(byPillar).map((p) => (
              <span
                key={p.name}
                className="badge text-[10px]"
                style={{
                  backgroundColor: `${p.color}15`,
                  color: p.color,
                }}
              >
                {p.name}: {p.count}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        {loading ? (
          <CalendarSkeleton />
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <CalendarDndGrid
              year={currentYear}
              month={currentMonth}
              posts={posts}
              calendarEntries={{}}
              onDayClick={handleDayClick}
              onPostClick={handlePostClick}
              onDeletePost={handleDeletePost}
            />

            <DragOverlay>
              {activePost ? (
                <div className="w-[160px]">
                  <CalendarPostCard
                    post={activePost}
                    onClick={() => {}}
                    isDragging
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Mobile: Weekly Planning List */}
      <div className="mt-6 md:hidden">
        <MobileWeeklyList posts={posts} onPostClick={handlePostClick} />
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePost}
        pillars={pillars}
        defaultDate={selectedDate}
      />
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border-default">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
          <div key={day} className="px-3 py-3 text-center text-label text-text-tertiary">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }, (_, i) => (
          <div key={i} className="min-h-[120px] border-b border-r border-border-default p-2">
            <div className="skeleton h-4 w-6 mb-2" />
            {i % 4 === 0 && <div className="skeleton h-5 w-full mb-1" />}
            {i % 3 === 0 && <div className="skeleton h-5 w-3/4" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// Mobile weekly planning view (no social posts)
function MobileWeeklyList({
  posts,
  onPostClick,
}: {
  posts: Post[];
  onPostClick: (post: Post) => void;
}) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-2">
      {weekDays.map((date, i) => {
        const dayPosts = posts.filter((p) => {
          if (!p.scheduledDate) return false;
          const pDate = new Date(p.scheduledDate);
          return (
            pDate.getDate() === date.getDate() &&
            pDate.getMonth() === date.getMonth() &&
            pDate.getFullYear() === date.getFullYear()
          );
        });

        return (
          <div key={i} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-label text-text-tertiary">{dayNames[i]}</span>
              <span className="text-sm font-medium text-text-primary">{date.getDate()}</span>
              {dayPosts.length > 0 && (
                <span className="text-[10px] text-text-tertiary ml-auto">
                  {dayPosts.length} post{dayPosts.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {dayPosts.length === 0 ? (
              <p className="text-xs text-text-tertiary">Nenhum post planejado</p>
            ) : (
              <div className="space-y-1">
                {dayPosts.map((post) => (
                  <CalendarPostCard key={post.id} post={post} onClick={() => onPostClick(post)} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
