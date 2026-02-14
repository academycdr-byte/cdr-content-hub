'use client';

import { useMemo, useState } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { cn, getMonthDays, isSameDay, isToday, formatDateISO } from '@/lib/utils';
import type { Post, CalendarEntry } from '@/types';
import CalendarPostCard from '@/components/calendar/calendar-post-card';
import CalendarSocialCard from '@/components/calendar/calendar-social-card';

const MAX_VISIBLE_ITEMS = 3;

interface CalendarDndGridProps {
  year: number;
  month: number;
  posts: Post[];
  calendarEntries: Record<string, CalendarEntry[]>;
  onDayClick: (date: Date) => void;
  onPostClick: (post: Post) => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export default function CalendarDndGrid({
  year,
  month,
  posts,
  calendarEntries,
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

  const getSocialEntriesForDay = (date: Date): CalendarEntry[] => {
    const dateKey = formatDateISO(date);
    const entries = calendarEntries[dateKey] || [];
    return entries.filter((e) => e.type === 'social');
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
          const socialEntries = getSocialEntriesForDay(date);

          return (
            <DroppableDay
              key={index}
              date={date}
              isCurrentMonth={isCurrentMonth}
              posts={dayPosts}
              socialEntries={socialEntries}
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
  socialEntries: CalendarEntry[];
  onDayClick: (date: Date) => void;
  onPostClick: (post: Post) => void;
}

function DroppableDay({
  date,
  isCurrentMonth,
  posts,
  socialEntries,
  onDayClick,
  onPostClick,
}: DroppableDayProps) {
  const dateId = formatDateISO(date);
  const today = isToday(date);
  const [expanded, setExpanded] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: dateId,
  });

  const totalItems = posts.length + socialEntries.length;
  const hasOverflow = totalItems > MAX_VISIBLE_ITEMS;

  // Determine visible items: internal posts first, then social
  const visiblePosts = expanded ? posts : posts.slice(0, MAX_VISIBLE_ITEMS);
  const remainingSlots = expanded
    ? socialEntries.length
    : Math.max(0, MAX_VISIBLE_ITEMS - visiblePosts.length);
  const visibleSocial = socialEntries.slice(0, remainingSlots);
  const hiddenCount = expanded ? 0 : totalItems - visiblePosts.length - visibleSocial.length;

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

      {/* Posts & Social Entries */}
      <div className="space-y-1">
        {/* Internal posts (draggable) */}
        {visiblePosts.map((post) => (
          <DraggablePost
            key={post.id}
            post={post}
            onPostClick={onPostClick}
          />
        ))}

        {/* Social posts (read-only) */}
        {visibleSocial.map((entry) => (
          <CalendarSocialCard
            key={entry.id}
            entry={entry}
          />
        ))}

        {/* Overflow indicator */}
        {hasOverflow && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-0.5 text-[11px] text-text-tertiary hover:text-accent px-1 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp size={10} />
                Menos
              </>
            ) : (
              <>
                <ChevronDown size={10} />
                +{hiddenCount} mais
              </>
            )}
          </button>
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
