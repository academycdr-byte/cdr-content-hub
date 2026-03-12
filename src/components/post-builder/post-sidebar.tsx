'use client';

import { Calendar, Tag, Layers, Clock, Instagram, User, Link2 } from 'lucide-react';
import type { Post, ContentPillar } from '@/types';
import { STATUS_LABELS, FORMAT_LABELS, type PostFormat, type PostStatus } from '@/types';

interface PostSidebarProps {
  post: Post;
  pillar: ContentPillar | undefined;
  referenceLink: string;
  onReferenceLinkChange: (value: string) => void;
}

const STATUS_COLORS: Record<PostStatus, string> = {
  IDEA: '#6E6E73',
  SCRIPT: '#7C3AED',
  PRODUCTION: '#2563EB',
  REVIEW: '#D97706',
  SCHEDULED: '#16A34A',
  PUBLISHED: '#4A7A00',
};

export default function PostSidebar({ post, pillar, referenceLink, onReferenceLinkChange }: PostSidebarProps) {
  const pillarColor = pillar?.color || '#6E6E73';
  const statusColor = STATUS_COLORS[post.status as PostStatus] || '#6E6E73';

  const scheduledLabel = post.scheduledDate
    ? new Date(post.scheduledDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'Não agendado';

  return (
    <div className="card p-5 space-y-4">
      <h3 className="text-heading-3 text-text-primary">Informações</h3>

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

      {/* Social Account */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-secondary">
          {post.socialAccount?.platform === 'instagram' ? (
            <Instagram size={14} className="text-text-tertiary" />
          ) : (
            <User size={14} className="text-text-tertiary" />
          )}
        </div>
        <div>
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Perfil</p>
          <p className="text-sm text-text-primary mt-0.5">
            {post.socialAccount
              ? `@${post.socialAccount.username}`
              : 'Sem perfil vinculado'}
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

      {/* Reference Link */}
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-secondary flex-shrink-0 mt-0.5">
          <Link2 size={14} className="text-text-tertiary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">Link de Referência</p>
          <input
            type="url"
            value={referenceLink}
            onChange={(e) => onReferenceLinkChange(e.target.value)}
            placeholder="https://..."
            className="w-full bg-bg-secondary border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-colors"
          />
          {referenceLink && (
            <a
              href={referenceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-accent hover:underline mt-1 inline-block truncate max-w-full"
            >
              Abrir link ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
