'use client';

import { useMemo } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { cn, getMonthDays, isSameDay, isToday, formatDateISO } from '@/lib/utils';
import type { Post } from '@/types';
import CalendarPostCard from '@/components/calendar/calendar-post-card';

interface CalendarDndGridProps {
  year: number;
  month: number;
  posts: Post[];
  onDayClick: (date: Date) => void;
  onPostClick: (post: Post) => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export default function CalendarDndGrid({
  year,
  month,
  posts,
  onDayClick,
  onPostClick,
}: CalendarDndGridProps) {
  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  const getPostsForDay = (date: Date): Post[] => {
    return posts.filter((post) => {
      if (!post.scheduledDate) return false;
      return isSameDay(new Date(post.scheduledDate), date);
    });
  };

  return (
    <div className="card overflow-hidden">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-border-default">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-3 py-3 text-center text-label text-text-tertiary"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((date, index) => {
          const isCurrentMonth = date.getMonth() === month;
          const dayPosts = getPostsForDay(date);

          return (
            <DroppableDay
              key={index}
              date={date}
              isCurrentMonth={isCurrentMonth}
              posts={dayPosts}
              onDayClick={onDayClick}
              onPostClick={onPostClick}
            />
          );
        })}
      </div>
    </div>
  );
}

interface DroppableDayProps {
  date: Date;
  isCurrentMonth: boolean;
  posts: Post[];
  onDayClick: (date: Date) => void;
  onPostClick: (post: Post) => void;
}

function DroppableDay({
  date,
  isCurrentMonth,
  posts,
  onDayClick,
  onPostClick,
}: DroppableDayProps) {
  const dateId = formatDateISO(date);
  const today = isToday(date);

  const { setNodeRef, isOver } = useDroppable({
    id: dateId,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[120px] border-b border-r border-border-default p-2 transition-colors group',
        !isCurrentMonth && 'bg-bg-secondary opacity-40',
        today && 'bg-accent-surface',
        isOver && 'bg-accent-surface border-accent'
      )}
    >
      {/* Day Header */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'text-sm font-medium',
            today
              ? 'flex h-7 w-7 items-center justify-center rounded-full bg-accent text-text-inverted'
              : isCurrentMonth
              ? 'text-text-primary'
              : 'text-text-tertiary'
          )}
        >
          {date.getDate()}
        </span>

        {isCurrentMonth && (
          <button
            onClick={() => onDayClick(date)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-text-tertiary hover:bg-bg-hover hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
            title="Criar post"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Posts */}
      <div className="space-y-1">
        {posts.slice(0, 3).map((post) => (
          <DraggablePost
            key={post.id}
            post={post}
            onPostClick={onPostClick}
          />
        ))}
        {posts.length > 3 && (
          <p className="text-[11px] text-text-tertiary px-1">
            +{posts.length - 3} mais
          </p>
        )}
      </div>
    </div>
  );
}

interface DraggablePostProps {
  post: Post;
  onPostClick: (post: Post) => void;
}

function DraggablePost({ post, onPostClick }: DraggablePostProps) {
  const isPublished = post.status === 'PUBLISHED';

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: post.id,
    disabled: isPublished,
  });

  return (
    <div
      ref={setNodeRef}
      {...(isPublished ? {} : listeners)}
      {...(isPublished ? {} : attributes)}
      className={cn(
        isPublished && 'cursor-default',
        !isPublished && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-30'
      )}
    >
      <CalendarPostCard
        post={post}
        onClick={() => onPostClick(post)}
        isDragging={isDragging}
      />
    </div>
  );
}
