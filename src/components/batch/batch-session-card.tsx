'use client';

import { Calendar, FileText, Play, CheckCircle, Clock } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import type { BatchStatus } from '@/types';

interface BatchSessionData {
  id: string;
  title: string;
  scheduledDate: string;
  notes: string | null;
  status: string;
  posts: { id: string }[];
}

interface BatchSessionCardProps {
  session: BatchSessionData;
  onClick: () => void;
  isSelected?: boolean;
}

const STATUS_CONFIG: Record<BatchStatus, { label: string; color: string; icon: React.ReactNode }> = {
  PLANNED: {
    label: 'Planejada',
    color: 'bg-info-surface text-info',
    icon: <Clock size={12} />,
  },
  IN_PROGRESS: {
    label: 'Em Andamento',
    color: 'bg-warning-surface text-warning',
    icon: <Play size={12} />,
  },
  COMPLETED: {
    label: 'Concluida',
    color: 'bg-success-surface text-success',
    icon: <CheckCircle size={12} />,
  },
};

export default function BatchSessionCard({ session, onClick, isSelected }: BatchSessionCardProps) {
  const statusConfig = STATUS_CONFIG[session.status as BatchStatus] || STATUS_CONFIG.PLANNED;
  const postCount = session.posts.length;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left card card-hover p-4 transition-all',
        isSelected && 'border-accent ring-1 ring-accent'
      )}
    >
      {/* Title + status */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-heading-3 text-text-primary truncate flex-1 mr-2">
          {session.title}
        </h3>
        <span className={cn('badge text-[10px] shrink-0', statusConfig.color)}>
          {statusConfig.icon}
          {statusConfig.label}
        </span>
      </div>

      {/* Date */}
      <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
        <Calendar size={12} className="text-text-tertiary" />
        <span>{formatDate(session.scheduledDate)}</span>
      </div>

      {/* Post count */}
      <div className="flex items-center gap-2 text-xs text-text-secondary">
        <FileText size={12} className="text-text-tertiary" />
        <span>{postCount} post{postCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Notes preview */}
      {session.notes && (
        <p className="text-xs text-text-tertiary mt-2 line-clamp-1 italic">
          {session.notes}
        </p>
      )}
    </button>
  );
}
