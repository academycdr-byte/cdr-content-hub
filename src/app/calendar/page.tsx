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
import { useCalendarStore } from '@/stores/calendar-store';
import { useToastStore } from '@/stores/toast-store';
import CalendarHeader from '@/components/calendar/calendar-header';
import CalendarFilters from '@/components/calendar/calendar-filters';
import CalendarDndGrid from '@/components/calendar/calendar-dnd-grid';
import CalendarPostCard from '@/components/calendar/calendar-post-card';
import CalendarSocialCard from '@/components/calendar/calendar-social-card';
import CreatePostModal, { type CreatePostData } from '@/components/posts/create-post-modal';
import { formatDateISO } from '@/lib/utils';
import type { Post, CalendarEntry } from '@/types';

export default function CalendarPage() {
  const {
    posts,
    pillars,
    loading: postsLoading,
    currentMonth,
    currentYear,
    setMonth,
    fetchPosts,
    fetchPillars,
    updatePost,
  } = usePostsStore();

  const {
    calendarEntries,
    accounts,
    selectedPlatform,
    selectedAccountId,
    loading: calendarLoading,
    fetchCalendarData,
    setPlatformFilter,
    setAccountFilter,
  } = useCalendarStore();

  const { addToast } = useToastStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activePost, setActivePost] = useState<Post | null>(null);

  const loading = postsLoading || calendarLoading;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch internal posts + calendar social data
  useEffect(() => {
    fetchPillars();
    fetchPosts(currentYear, currentMonth);
    fetchCalendarData(currentYear, currentMonth);
  }, [fetchPillars, fetchPosts, fetchCalendarData, currentYear, currentMonth]);

  // Re-fetch calendar data when filters change
  useEffect(() => {
    fetchCalendarData(currentYear, currentMonth);
  }, [fetchCalendarData, currentYear, currentMonth, selectedPlatform, selectedAccountId]);

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

      {/* Filters */}
      <div className="mt-4">
        <CalendarFilters
          selectedPlatform={selectedPlatform}
          selectedAccountId={selectedAccountId}
          accounts={accounts}
          onPlatformChange={setPlatformFilter}
          onAccountChange={setAccountFilter}
        />
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
              posts={selectedPlatform ? [] : posts}
              calendarEntries={calendarEntries}
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

      {/* Mobile: Weekly List with social posts */}
      <div className="mt-6 md:hidden">
        <MobileWeeklyList posts={posts} calendarEntries={calendarEntries} />
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
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day) => (
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

// Mobile weekly view with social posts
function MobileWeeklyList({
  posts,
  calendarEntries,
}: {
  posts: Post[];
  calendarEntries: Record<string, CalendarEntry[]>;
}) {
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

        const dateKey = formatDateISO(date);
        const socialEntries = (calendarEntries[dateKey] || []).filter(
          (e) => e.type === 'social'
        );

        const hasContent = dayPosts.length > 0 || socialEntries.length > 0;

        return (
          <div key={i} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-label text-text-tertiary">{dayNames[i]}</span>
              <span className="text-sm font-medium text-text-primary">{date.getDate()}</span>
              {hasContent && (
                <span className="text-[10px] text-text-tertiary ml-auto">
                  {dayPosts.length + socialEntries.length} post{dayPosts.length + socialEntries.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {!hasContent ? (
              <p className="text-xs text-text-tertiary">Nenhum post</p>
            ) : (
              <div className="space-y-1">
                {dayPosts.map((post) => (
                  <CalendarPostCard key={post.id} post={post} onClick={() => {}} />
                ))}
                {socialEntries.map((entry) => (
                  <CalendarSocialCard key={entry.id} entry={entry} compact />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
