'use client';

import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { cn, getMonthDays, isSameDay, isToday } from '@/lib/utils';
import type { Post } from '@/types';
import CalendarPostCard from '@/components/calendar/calendar-post-card';

interface CalendarGridProps {
  year: number;
  month: number;
  posts: Post[];
  onDayClick: (date: Date) => void;
  onPostClick: (post: Post) => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export default function CalendarGrid({
  year,
  month,
  posts,
  onDayClick,
  onPostClick,
}: CalendarGridProps) {
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
          const today = isToday(date);
          const dayPosts = getPostsForDay(date);
          const hasNoPosts = isCurrentMonth && dayPosts.length === 0;

          return (
            <div
              key={index}
              className={cn(
                'min-h-[120px] border-b border-r border-border-default p-2 transition-colors',
                !isCurrentMonth && 'bg-bg-secondary opacity-40',
                today && 'bg-accent-surface',
                hasNoPosts && isCurrentMonth && 'bg-bg-primary'
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
                    style={{ opacity: 1 }}
                    title="Criar post"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>

              {/* Posts */}
              <div className="space-y-1">
                {dayPosts.slice(0, 3).map((post) => (
                  <CalendarPostCard
                    key={post.id}
                    post={post}
                    onClick={() => onPostClick(post)}
                  />
                ))}
                {dayPosts.length > 3 && (
                  <p className="text-[11px] text-text-tertiary px-1">
                    +{dayPosts.length - 3} mais
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
