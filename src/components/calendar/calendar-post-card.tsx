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
  onTogglePublished,
  isDragging,
}: CalendarPostCardProps) {
  const pillarColor = post.pillar?.color || '#6E6E73';
  const isPublished = post.status === 'PUBLISHED';

  return (
    <div
      className={cn(
        'group/card relative w-full rounded-lg px-2.5 py-1.5 text-left transition-[opacity,box-shadow]',
        'hover:ring-1 hover:ring-border-strong',
        isDragging && 'opacity-50 ring-2 ring-accent',
        isPublished && 'opacity-60'
      )}
      style={{
        backgroundColor: `${pillarColor}18`,
        borderLeft: `3px solid ${pillarColor}`,
      }}
    >
      <div className="flex items-start gap-1.5">
        {/* Check button — toggle published */}
        {onTogglePublished && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePublished();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={cn(
              'shrink-0 flex items-center justify-center h-4 w-4 rounded-full border transition-colors mt-0.5',
              isPublished
                ? 'bg-success border-success text-white'
                : 'border-text-tertiary hover:border-success hover:bg-success/10'
            )}
            title={isPublished ? 'Desmarcar como postado' : 'Marcar como postado'}
          >
            {isPublished && <Check size={8} strokeWidth={3} />}
          </button>
        )}

        <button
          onClick={onClick}
          className="flex flex-col gap-0.5 min-w-0 flex-1"
        >
          {/* Line 1: Title */}
          <span className={cn(
            'text-[11px] font-semibold leading-tight text-text-primary truncate w-full text-left',
            isPublished && 'line-through text-text-tertiary'
          )}>
            {post.title}
          </span>

          {/* Line 2: Format + Account */}
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 flex items-center gap-1" style={{ color: pillarColor }}>
              {FORMAT_ICONS[post.format as PostFormat]}
              <span className="text-[9px] font-medium">
                {FORMAT_LABELS[post.format as PostFormat]}
              </span>
            </span>
            {post.socialAccount && (
              <span className="flex items-center gap-0.5 text-[9px] text-text-tertiary truncate" title={`@${post.socialAccount.username}`}>
                {post.socialAccount.platform === 'instagram' ? (
                  <Instagram size={9} className="shrink-0" />
                ) : (
                  <svg className="shrink-0" width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.36 6.36 0 0 0-1-.08 6.27 6.27 0 0 0-6.28 6.28 6.28 6.28 0 0 0 6.28 6.28 6.28 6.28 0 0 0 6.28-6.28V8.87a8.2 8.2 0 0 0 4.84 1.57V7.01a4.85 4.85 0 0 1-.81-.32z"/></svg>
                )}
                <span className="truncate">@{post.socialAccount.username}</span>
              </span>
            )}
          </div>
        </button>
      </div>

      {onDelete && !isPublished && (
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
