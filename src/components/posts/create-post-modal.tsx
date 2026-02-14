'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { X, Loader2 } from 'lucide-react';
import { cn, formatDateISO } from '@/lib/utils';
import type { ContentPillar, PostFormat } from '@/types';
import { FORMAT_LABELS } from '@/types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePostData) => Promise<void>;
  pillars: ContentPillar[];
  defaultDate?: Date | null;
}

export interface CreatePostData {
  title: string;
  format: PostFormat;
  pillarId: string;
  scheduledDate: string | null;
}

const FORMATS: PostFormat[] = ['REEL', 'CAROUSEL', 'STATIC', 'STORY'];

export default function CreatePostModal({
  isOpen,
  onClose,
  onSubmit,
  pillars,
  defaultDate,
}: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState<PostFormat>('REEL');
  const [pillarId, setPillarId] = useState(pillars[0]?.id || '');
  const [scheduledDate, setScheduledDate] = useState(
    defaultDate ? formatDateISO(defaultDate) : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync scheduledDate when modal opens with a new defaultDate
  useEffect(() => {
    if (isOpen) {
      setScheduledDate(defaultDate ? formatDateISO(defaultDate) : '');
      setError('');
    }
  }, [isOpen, defaultDate]);

  // Sync pillarId when pillars load
  useEffect(() => {
    if (pillars.length > 0 && !pillarId) {
      setPillarId(pillars[0].id);
    }
  }, [pillars, pillarId]);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Titulo e obrigatorio');
      return;
    }
    if (!pillarId) {
      setError('Selecione um pilar');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        format,
        pillarId,
        scheduledDate: scheduledDate || null,
      });
      // Reset form
      setTitle('');
      setFormat('REEL');
      setPillarId(pillars[0]?.id || '');
      setScheduledDate('');
      onClose();
    } catch {
      setError('Erro ao criar post. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 animate-backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-[480px] rounded-2xl bg-bg-card border border-border-default animate-scale-in"
          style={{ boxShadow: 'var(--shadow-xl)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-default px-6 py-4">
            <h2 className="text-heading-2 text-text-primary">Novo Post</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label htmlFor="post-title" className="text-label text-text-secondary mb-2 block">
                Titulo
              </label>
              <input
                id="post-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Como geramos ROAS 8x para loja de moda"
                className="input"
                autoFocus
              />
            </div>

            {/* Format */}
            <div>
              <label className="text-label text-text-secondary mb-2 block">
                Formato
              </label>
              <div className="grid grid-cols-4 gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                      format === f
                        ? 'border-accent bg-accent-surface text-accent'
                        : 'border-border-default bg-bg-primary text-text-secondary hover:border-border-strong'
                    )}
                  >
                    {FORMAT_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>

            {/* Pillar */}
            <div>
              <label htmlFor="post-pillar" className="text-label text-text-secondary mb-2 block">
                Pilar de Conteudo
              </label>
              <div className="grid grid-cols-1 gap-2">
                {pillars.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPillarId(p.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-all',
                      pillarId === p.id
                        ? 'border-accent bg-accent-surface'
                        : 'border-border-default bg-bg-primary hover:border-border-strong'
                    )}
                  >
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className={cn(
                      'font-medium',
                      pillarId === p.id ? 'text-text-primary' : 'text-text-secondary'
                    )}>
                      {p.name}
                    </span>
                    <span className="ml-auto text-xs text-text-tertiary">{p.targetPercentage}%</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <label htmlFor="post-date" className="text-label text-text-secondary mb-2 block">
                Data Agendada
              </label>
              <input
                id="post-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="input"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-error-surface px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-accent flex-1 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Post'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
