'use client';

import { Film, LayoutGrid, Image, MessageCircle, AlertTriangle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Post, PostFormat } from '@/types';

interface PipelineCardProps {
  post: Post;
  daysInColumn: number;
  onClick: () => void;
  isDragging?: boolean;
}

const FORMAT_ICONS: Record<PostFormat, React.ReactNode> = {
  REEL: <Film size={12} />,
  CAROUSEL: <LayoutGrid size={12} />,
  STATIC: <Image size={12} />,
  STORY: <MessageCircle size={12} />,
};

export default function PipelineCard({ post, daysInColumn, onClick, isDragging }: PipelineCardProps) {
  const pillarColor = post.pillar?.color || '#6E6E73';
  const isOverdue = daysInColumn > 3;

  const scheduledLabel = post.scheduledDate
    ? new Date(post.scheduledDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left card p-3 transition-all group',
        'hover:border-border-strong',
        isDragging && 'opacity-50 ring-2 ring-accent shadow-[var(--shadow-lg)]'
      )}
      style={{ borderLeft: `3px solid ${pillarColor}` }}
    >
      {/* Title */}
      <p className="text-sm font-medium text-text-primary leading-snug line-clamp-2 mb-2">
        {post.title}
      </p>

      {/* Metadata row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Pillar badge */}
        <span
          className="badge text-[10px]"
          style={{
            backgroundColor: `${pillarColor}15`,
            color: pillarColor,
          }}
        >
          {post.pillar?.name || 'Sem pilar'}
        </span>

        {/* Format icon */}
        <span
          className="flex items-center gap-1 text-[10px] text-text-tertiary"
        >
          {FORMAT_ICONS[post.format as PostFormat]}
        </span>

        {/* Assigned to */}
        {post.assignedTo && (
          <span className="text-[10px] text-text-tertiary truncate max-w-[80px]">
            {post.assignedTo}
          </span>
        )}
      </div>

      {/* Bottom row: scheduled date + days in column */}
      <div className="flex items-center justify-between mt-2">
        {scheduledLabel && (
          <span className="flex items-center gap-1 text-[10px] text-text-tertiary">
            <Calendar size={10} />
            {scheduledLabel}
          </span>
        )}

        <span
          className={cn(
            'flex items-center gap-1 text-[10px] ml-auto',
            isOverdue ? 'text-warning font-medium' : 'text-text-tertiary'
          )}
        >
          {isOverdue && <AlertTriangle size={10} />}
          {daysInColumn}d
        </span>
      </div>
    </button>
  );
}
