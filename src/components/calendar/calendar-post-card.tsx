'use client';

import { memo } from 'react';
import { Film, LayoutGrid, Image, MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Post, PostFormat } from '@/types';

interface CalendarPostCardProps {
  post: Post;
  onClick: () => void;
  onDelete?: () => void;
  isDragging?: boolean;
}

const FORMAT_ICONS: Record<PostFormat, React.ReactNode> = {
  REEL: <Film size={11} />,
  CAROUSEL: <LayoutGrid size={11} />,
  STATIC: <Image size={11} />,
  STORY: <MessageCircle size={11} />,
};

const CalendarPostCard = memo(function CalendarPostCard({
  post,
  onClick,
  onDelete,
  isDragging,
}: CalendarPostCardProps) {
  const pillarColor = post.pillar?.color || '#6E6E73';

  return (
    <div
      className={cn(
        'group/card relative w-full flex items-center gap-1.5 rounded-md px-2 py-1 text-left text-[11px] font-medium transition-all',
        'hover:ring-1 hover:ring-border-strong',
        isDragging && 'opacity-50 ring-2 ring-accent'
      )}
      style={{
        backgroundColor: `${pillarColor}12`,
        borderLeft: `3px solid ${pillarColor}`,
      }}
    >
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 min-w-0 flex-1"
      >
        <span className="shrink-0" style={{ color: pillarColor }}>
          {FORMAT_ICONS[post.format as PostFormat]}
        </span>
        <span className="truncate text-text-primary">{post.title}</span>
      </button>

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="shrink-0 hidden group-hover/card:flex items-center justify-center h-4 w-4 rounded-sm bg-error/10 text-error hover:bg-error/20 transition-colors"
          title="Remover post"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
});

export default CalendarPostCard;
