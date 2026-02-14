'use client';

import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { Post, PostStatus } from '@/types';
import { STATUS_LABELS } from '@/types';
import PipelineCard from '@/components/pipeline/pipeline-card';

interface PipelineColumnProps {
  status: PostStatus;
  posts: Post[];
  onPostClick: (post: Post) => void;
}

const STATUS_COLORS: Record<PostStatus, string> = {
  IDEA: '#6E6E73',
  SCRIPT: '#7C3AED',
  PRODUCTION: '#2563EB',
  REVIEW: '#D97706',
  SCHEDULED: '#16A34A',
  PUBLISHED: '#4A7A00',
};

function getDaysInColumn(post: Post): number {
  const updatedAt = new Date(post.updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - updatedAt.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export default function PipelineColumn({ status, posts, onPostClick }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const sortedPosts = [...posts].sort((a, b) => {
    // Sort by scheduled date (closest first), nulls last
    if (a.scheduledDate && b.scheduledDate) {
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    }
    if (a.scheduledDate) return -1;
    if (b.scheduledDate) return 1;
    return 0;
  });

  const statusColor = STATUS_COLORS[status];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-w-[200px] flex-1 rounded-xl bg-bg-secondary transition-colors',
        isOver && 'bg-accent-surface ring-2 ring-accent'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border-default">
        <div
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: statusColor }}
        />
        <h3 className="text-xs font-semibold text-text-primary flex-1">
          {STATUS_LABELS[status]}
        </h3>
        <span
          className="badge text-[10px] px-2 py-0.5"
          style={{
            backgroundColor: `${statusColor}15`,
            color: statusColor,
          }}
        >
          {posts.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)]">
        {sortedPosts.map((post) => (
          <DraggablePipelineCard
            key={post.id}
            post={post}
            daysInColumn={getDaysInColumn(post)}
            onPostClick={onPostClick}
          />
        ))}

        {posts.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-[11px] text-text-tertiary">Nenhum post</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Draggable Card Wrapper =====

interface DraggablePipelineCardProps {
  post: Post;
  daysInColumn: number;
  onPostClick: (post: Post) => void;
}

function DraggablePipelineCard({ post, daysInColumn, onPostClick }: DraggablePipelineCardProps) {
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
        !isPublished && 'cursor-grab active:cursor-grabbing',
        isPublished && 'cursor-default',
        isDragging && 'opacity-30'
      )}
    >
      <PipelineCard
        post={post}
        daysInColumn={daysInColumn}
        onClick={() => onPostClick(post)}
        isDragging={isDragging}
      />
    </div>
  );
}
