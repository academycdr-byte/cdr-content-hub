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
import { usePostsStore } from '@/stores/posts-store';
import { useToastStore } from '@/stores/toast-store';
import CalendarHeader from '@/components/calendar/calendar-header';
import CalendarDndGrid from '@/components/calendar/calendar-dnd-grid';
import CalendarPostCard from '@/components/calendar/calendar-post-card';
import CreatePostModal, { type CreatePostData } from '@/components/posts/create-post-modal';
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
  } = usePostsStore();

  const { addToast } = useToastStore();

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

  const handlePostClick = useCallback((_post: Post) => {
    // Future: Open post detail/edit drawer
  }, []);

  const handleCreatePost = useCallback(async (data: CreatePostData) => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to create post');

    const newPost = await res.json() as Post;
    usePostsStore.getState().addPost(newPost);
    addToast('Post criado com sucesso!', 'success');
  }, [addToast]);

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
      addToast('Posts publicados nao podem ser movidos', 'error');
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

      <div className="mt-6">
        {loading ? (
          <div className="card p-20 flex items-center justify-center">
            <div className="skeleton h-4 w-32" />
          </div>
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
              onDayClick={handleDayClick}
              onPostClick={handlePostClick}
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

      {/* Mobile: Weekly List */}
      <div className="mt-6 md:hidden">
        <MobileWeeklyList posts={posts} />
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

// Mobile weekly view
function MobileWeeklyList({ posts }: { posts: Post[] }) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

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
            </div>
            {dayPosts.length === 0 ? (
              <p className="text-xs text-text-tertiary">Nenhum post</p>
            ) : (
              <div className="space-y-1">
                {dayPosts.map((post) => (
                  <CalendarPostCard key={post.id} post={post} onClick={() => {}} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
