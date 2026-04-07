'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { X, Loader2 } from 'lucide-react';
import { cn, formatDateISO } from '@/lib/utils';
import type { ContentPillar, PostFormat, SocialAccount, ContentSeries } from '@/types';
import { FORMAT_LABELS } from '@/types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePostData) => Promise<void>;
  pillars: ContentPillar[];
  defaultDate?: Date | null;
  socialAccounts?: SocialAccount[];
  series?: ContentSeries[];
}

export interface CreatePostData {
  title: string;
  format: PostFormat;
  pillarId: string;
  scheduledDate: string | null;
  purpose: string | null;
  audience: string | null;
  onlyIvan: boolean;
  socialAccountId: string | null;
  seriesId: string | null;
  seriesEpisode: number | null;
  ctaKeyword: string | null;
}

const FORMATS: PostFormat[] = ['REEL', 'CAROUSEL', 'STATIC', 'STORY'];

export default function CreatePostModal({
  isOpen,
  onClose,
  onSubmit,
  pillars,
  defaultDate,
  socialAccounts = [],
  series = [],
}: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState<PostFormat>('REEL');
  const [pillarId, setPillarId] = useState(pillars[0]?.id || '');
  const [scheduledDate, setScheduledDate] = useState(
    defaultDate ? formatDateISO(defaultDate) : ''
  );
  const [purpose, setPurpose] = useState('');
  const [audience, setAudience] = useState('');
  const [onlyIvan, setOnlyIvan] = useState(false);
  const [socialAccountId, setSocialAccountId] = useState<string | null>(null);
  const [seriesId, setSeriesId] = useState<string | null>(null);
  const [seriesEpisode, setSeriesEpisode] = useState<number | null>(null);
  const [ctaKeyword, setCtaKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter pillars by selected social account
  const filteredPillars = socialAccountId
    ? pillars.filter((p) => p.socialAccountId === socialAccountId || !p.socialAccountId)
    : pillars;

  // Filter series by selected social account
  const filteredSeries = socialAccountId
    ? series.filter((s) => s.socialAccountId === socialAccountId)
    : series;

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
      setError('Título é obrigatório');
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
        purpose: purpose.trim() || null,
        audience: audience.trim() || null,
        onlyIvan,
        socialAccountId,
        seriesId,
        seriesEpisode,
        ctaKeyword: ctaKeyword.trim() || null,
      });
      // Reset form
      setTitle('');
      setFormat('REEL');
      setPillarId(pillars[0]?.id || '');
      setScheduledDate('');
      setPurpose('');
      setAudience('');
      setOnlyIvan(false);
      setSocialAccountId(null);
      setSeriesId(null);
      setSeriesEpisode(null);
      setCtaKeyword('');
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
          className="w-full max-w-[480px] max-h-[90vh] flex flex-col rounded-[20px] bg-bg-modal border border-border-default animate-scale-in"
          style={{ boxShadow: 'var(--shadow-xl)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-default px-6 py-4 shrink-0">
            <h2 className="text-heading-2 text-text-primary">Novo Post</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
            {/* Title */}
            <div>
              <label htmlFor="post-title" className="text-label text-text-secondary mb-2 block">
                Título
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
                Pilar de Conteúdo
              </label>
              <div className="grid grid-cols-1 gap-2">
                {filteredPillars.map((p) => (
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

            {/* Purpose */}
            <div>
              <label htmlFor="post-purpose" className="text-label text-text-secondary mb-2 block">
                Que mudança eu quero criar com esse post?
              </label>
              <textarea
                id="post-purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Ex: Fazer donos de e-commerce entenderem que precisam de tráfego pago estratégico"
                className="input min-h-[60px] resize-y"
                rows={2}
              />
            </div>

            {/* Audience */}
            <div>
              <label htmlFor="post-audience" className="text-label text-text-secondary mb-2 block">
                Para quem ESPECIFICAMENTE?
              </label>
              <textarea
                id="post-audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Ex: Donos de e-commerce de moda com faturamento entre 50k-200k/mês"
                className="input min-h-[60px] resize-y"
                rows={2}
              />
            </div>

            {/* Only Ivan */}
            <div>
              <label
                htmlFor="post-only-ivan"
                className="flex items-center gap-3 rounded-lg border border-border-default bg-bg-primary px-4 py-3 cursor-pointer transition-all hover:border-border-strong"
              >
                <input
                  id="post-only-ivan"
                  type="checkbox"
                  checked={onlyIvan}
                  onChange={(e) => setOnlyIvan(e.target.checked)}
                  className="h-4 w-4 rounded accent-accent"
                />
                <div>
                  <p className="text-sm font-medium text-text-primary">Só o Ivan poderia ter criado isso?</p>
                  <p className="text-[11px] text-text-tertiary">Marque se este conteúdo tem a sua assinatura única</p>
                </div>
              </label>
            </div>

            {/* Social Account */}
            {socialAccounts.length > 0 && (
              <div>
                <label htmlFor="post-account" className="text-label text-text-secondary mb-2 block">
                  Perfil Social
                </label>
                <select
                  id="post-account"
                  value={socialAccountId || ''}
                  onChange={(e) => setSocialAccountId(e.target.value || null)}
                  className="input"
                >
                  <option value="">Nenhum (sem perfil vinculado)</option>
                  {socialAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.platform === 'instagram' ? 'Instagram' : 'TikTok'} — @{acc.username}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Series */}
            {filteredSeries.length > 0 && (
              <div>
                <label htmlFor="post-series" className="text-label text-text-secondary mb-2 block">
                  Série
                </label>
                <div className="flex gap-2">
                  <select
                    id="post-series"
                    value={seriesId || ''}
                    onChange={(e) => setSeriesId(e.target.value || null)}
                    className="input flex-1"
                  >
                    <option value="">Nenhuma série</option>
                    {filteredSeries.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {seriesId && (
                    <input
                      type="number"
                      min={1}
                      value={seriesEpisode || ''}
                      onChange={(e) => setSeriesEpisode(parseInt(e.target.value) || null)}
                      placeholder="EP#"
                      className="input w-20 text-center"
                    />
                  )}
                </div>
              </div>
            )}

            {/* CTA Keyword */}
            <div>
              <label htmlFor="post-cta" className="text-label text-text-secondary mb-2 block">
                DM Keyword (CTA)
              </label>
              <input
                id="post-cta"
                type="text"
                value={ctaKeyword}
                onChange={(e) => setCtaKeyword(e.target.value.toUpperCase())}
                placeholder="Ex: DIAGNÓSTICO, CHECKLIST"
                className="input"
              />
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
