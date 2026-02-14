'use client';

import { Film, LayoutGrid, Image, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Post, PostFormat } from '@/types';

interface CalendarPostCardProps {
  post: Post;
  onClick: () => void;
  isDragging?: boolean;
}

const FORMAT_ICONS: Record<PostFormat, React.ReactNode> = {
  REEL: <Film size={11} />,
  CAROUSEL: <LayoutGrid size={11} />,
  STATIC: <Image size={11} />,
  STORY: <MessageCircle size={11} />,
};

export default function CalendarPostCard({
  post,
  onClick,
  isDragging,
}: CalendarPostCardProps) {
  const pillarColor = post.pillar?.color || '#6E6E73';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-1.5 rounded-md px-2 py-1 text-left text-[11px] font-medium transition-all',
        'hover:ring-1 hover:ring-border-strong',
        isDragging && 'opacity-50 ring-2 ring-accent'
      )}
      style={{
        backgroundColor: `${pillarColor}12`,
        borderLeft: `3px solid ${pillarColor}`,
      }}
    >
      <span style={{ color: pillarColor }}>
        {FORMAT_ICONS[post.format as PostFormat]}
      </span>
      <span className="truncate text-text-primary">{post.title}</span>
    </button>
  );
}
