'use client';

import { memo } from 'react';
import { Film, LayoutGrid, Image, MessageCircle, X, Instagram } from 'lucide-react';
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

const FORMAT_LABELS: Record<PostFormat, string> = {
  REEL: 'Reel',
  CAROUSEL: 'Carrossel',
  STATIC: 'Imagem',
  STORY: 'Story',
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
        'group/card relative w-full flex items-center gap-1.5 rounded-md px-2 py-1 text-left text-[11px] font-medium transition-[opacity,box-shadow]',
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
        <span className="shrink-0 text-[9px] font-normal text-text-tertiary">
          {FORMAT_LABELS[post.format as PostFormat]}
        </span>
        {post.socialAccount && (
          <span className="shrink-0 flex items-center gap-0.5 text-[9px] font-normal text-text-tertiary" title={`@${post.socialAccount.username}`}>
            {post.socialAccount.platform === 'instagram' ? (
              <Instagram size={9} />
            ) : (
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.36 6.36 0 0 0-1-.08 6.27 6.27 0 0 0-6.28 6.28 6.28 6.28 0 0 0 6.28 6.28 6.28 6.28 0 0 0 6.28-6.28V8.87a8.2 8.2 0 0 0 4.84 1.57V7.01a4.85 4.85 0 0 1-.81-.32z"/></svg>
            )}
            <span className="max-w-[50px] truncate">@{post.socialAccount.username}</span>
          </span>
        )}
      </button>

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover/card:flex items-center justify-center h-4 w-4 rounded-sm bg-error/10 text-error hover:bg-error/20 transition-colors z-10"
          title="Remover post"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
});

export default CalendarPostCard;
