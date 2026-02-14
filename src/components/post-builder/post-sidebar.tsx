'use client';

import { Calendar, User, Tag, Layers, Clock } from 'lucide-react';
import type { Post, ContentPillar } from '@/types';
import { STATUS_LABELS, FORMAT_LABELS, type PostFormat, type PostStatus } from '@/types';

interface PostSidebarProps {
  post: Post;
  pillar: ContentPillar | undefined;
}

const STATUS_COLORS: Record<PostStatus, string> = {
  IDEA: '#6E6E73',
  SCRIPT: '#7C3AED',
  PRODUCTION: '#2563EB',
  REVIEW: '#D97706',
  SCHEDULED: '#16A34A',
  PUBLISHED: '#4A7A00',
};

export default function PostSidebar({ post, pillar }: PostSidebarProps) {
  const pillarColor = pillar?.color || '#6E6E73';
  const statusColor = STATUS_COLORS[post.status as PostStatus] || '#6E6E73';

  const scheduledLabel = post.scheduledDate
    ? new Date(post.scheduledDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'Nao agendado';

  return (
    <div className="card p-5 space-y-4">
      <h3 className="text-heading-3 text-text-primary">Informacoes</h3>

      {/* Status */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-secondary">
          <Layers size={14} className="text-text-tertiary" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Status</p>
          <span
            className="badge text-[11px] mt-0.5"
            style={{
              backgroundColor: `${statusColor}15`,
              color: statusColor,
            }}
          >
            {STATUS_LABELS[post.status as PostStatus] || post.status}
          </span>
        </div>
      </div>

      {/* Pillar */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-secondary">
          <Tag size={14} className="text-text-tertiary" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Pilar</p>
          <span
            className="badge text-[11px] mt-0.5"
            style={{
              backgroundColor: `${pillarColor}15`,
              color: pillarColor,
            }}
          >
            {pillar?.name || 'Sem pilar'}
          </span>
        </div>
      </div>

      {/* Format */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-secondary">
          <Clock size={14} className="text-text-tertiary" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Formato</p>
          <p className="text-sm text-text-primary mt-0.5">
            {FORMAT_LABELS[post.format as PostFormat] || post.format}
          </p>
        </div>
      </div>

      {/* Assigned To */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-secondary">
          <User size={14} className="text-text-tertiary" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Responsavel</p>
          <p className="text-sm text-text-primary mt-0.5">
            {post.assignedTo || 'Nao atribuido'}
          </p>
        </div>
      </div>

      {/* Scheduled Date */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-secondary">
          <Calendar size={14} className="text-text-tertiary" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Data Agendada</p>
          <p className="text-sm text-text-primary mt-0.5">
            {scheduledLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
