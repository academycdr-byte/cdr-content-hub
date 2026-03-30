'use client';

import { memo } from 'react';
import { Film, LayoutGrid, Image, MessageCircle, X, Instagram, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Post, PostFormat } from '@/types';

interface CalendarPostCardProps {
  post: Post;
  onClick: () => void;
  onDelete?: () => void;
  onTogglePublished?: () => void;
  isDragging?: boolean;
}

const FORMAT_ICONS: Record<PostFormat, React.ReactNode> = {
  REEL: <Film size={12} />,
  CAROUSEL: <LayoutGrid size={12} />,
  STATIC: <Image size={12} />,
  STORY: <MessageCircle size={12} />,
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
  onTogglePublished,
  isDragging,
}: CalendarPostCardProps) {
  const pillarColor = post.pillar?.color || '#6E6E73';
  const isPublished = post.status === 'PUBLISHED';

  return (
    <div
      className={cn(
        'group/card relative w-full rounded-lg px-3 py-2 text-left transition-[opacity,box-shadow]',
        'hover:ring-1 hover:ring-border-strong',
        isDragging && 'opacity-50 ring-2 ring-accent',
        isPublished && 'opacity-60'
      )}
      style={{
        backgroundColor: `${pillarColor}18`,
        borderLeft: `3px solid ${pillarColor}`,
      }}
    >
      <div className="flex items-start gap-2">
        {/* Check button — toggle published */}
        {onTogglePublished && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePublished();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={cn(
              'shrink-0 flex items-center justify-center h-4.5 w-4.5 rounded-full border transition-colors mt-0.5',
              isPublished
                ? 'bg-success border-success text-white'
                : 'border-text-tertiary hover:border-success hover:bg-success/10'
            )}
            title={isPublished ? 'Desmarcar como postado' : 'Marcar como postado'}
          >
            {isPublished && <Check size={9} strokeWidth={3} />}
          </button>
        )}

        <button
          onClick={onClick}
          className="flex flex-col gap-1 min-w-0 flex-1"
        >
          {/* Line 1: Title */}
          <span className={cn(
            'text-xs font-semibold leading-tight text-text-primary truncate w-full text-left',
            isPublished && 'line-through text-text-tertiary'
          )}>
            {post.title}
          </span>

          {/* Line 2: Format */}
          <div className="flex items-center gap-1" style={{ color: pillarColor }}>
            {FORMAT_ICONS[post.format as PostFormat]}
            <span className="text-[10px] font-medium">
              {FORMAT_LABELS[post.format as PostFormat]}
            </span>
          </div>

          {/* Line 3: Account/Profile */}
          {post.socialAccount && (
            <div className="flex items-center gap-1 text-[10px] text-text-tertiary" title={`@${post.socialAccount.username}`}>
              {post.socialAccount.platform === 'instagram' ? (
                <Instagram size={10} className="shrink-0" />
              ) : (
                <svg className="shrink-0" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.36 6.36 0 0 0-1-.08 6.27 6.27 0 0 0-6.28 6.28 6.28 6.28 0 0 0 6.28 6.28 6.28 6.28 0 0 0 6.28-6.28V8.87a8.2 8.2 0 0 0 4.84 1.57V7.01a4.85 4.85 0 0 1-.81-.32z"/></svg>
              )}
              <span className="truncate">@{post.socialAccount.username}</span>
            </div>
          )}
        </button>
      </div>

      {onDelete && !isPublished && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden group-hover/card:flex items-center justify-center h-5 w-5 rounded-sm bg-error/10 text-error hover:bg-error/20 transition-colors z-10"
          title="Remover post"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
});

export default CalendarPostCard;
