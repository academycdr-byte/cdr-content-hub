'use client';

import { useState } from 'react';
import { Lightbulb, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContentPillar } from '@/types';
import { FORMATS, FORMAT_FILTER_LABELS, CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS } from './constants';

interface CreateHookModalProps {
  pillars: ContentPillar[];
  onSubmit: (data: {
    text: string;
    scenes?: string | null;
    conclusion?: string | null;
    pillarId: string | null;
    format: string;
    category: string;
  }) => Promise<void>;
  onClose: () => void;
}

export function CreateHookModal({ pillars, onSubmit, onClose }: CreateHookModalProps) {
  const [text, setText] = useState('');
  const [scenes, setScenes] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [pillarId, setPillarId] = useState<string | null>(null);
  const [format, setFormat] = useState('ALL');
  const [category, setCategory] = useState('QUESTION');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setSaving(true);
    try {
      await onSubmit({
        text: text.trim(),
        scenes: scenes.trim() || null,
        conclusion: conclusion.trim() || null,
        pillarId,
        format,
        category,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 animate-backdrop" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div
          className="relative w-full max-w-lg rounded-2xl bg-bg-modal border border-border-default animate-scale-in"
          style={{ boxShadow: 'var(--shadow-xl)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-h-[85vh] overflow-y-auto rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border-default p-4 sm:p-5 bg-bg-modal rounded-t-2xl">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
            style={{ backgroundColor: 'var(--accent-surface)' }}
          >
            <Lightbulb size={18} className="text-accent" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-text-primary">Nova Ideia</h2>
            <p className="text-xs text-text-tertiary">Estruture seu roteiro de conteúdo</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-tertiary hover:bg-bg-hover transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5">
          {/* Section: Roteiro */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-text-secondary tracking-wide">Roteiro</p>

            {/* Gancho */}
            <div>
              <label className="text-xs text-text-tertiary mb-1 block">Gancho *</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="A frase de abertura que prende a atencao. Ex: Voce sabia que 80% dos e-commerces perdem dinheiro em ads?"
                className="input min-h-[72px] resize-y"
                autoFocus
              />
            </div>

            {/* Cenas */}
            <div>
              <label className="text-xs text-text-tertiary mb-1 block">Cenas</label>
              <textarea
                value={scenes}
                onChange={(e) => setScenes(e.target.value)}
                placeholder="Descreva cada cena em uma linha. Ex:&#10;Mostrar dashboard com métricas&#10;Explicar estratégia X&#10;Revelar resultado final"
                className="input min-h-[90px] resize-y"
              />
              <p className="text-[11px] text-text-tertiary mt-1">Uma cena por linha</p>
            </div>

            {/* Conclusão */}
            <div>
              <label className="text-xs text-text-tertiary mb-1 block">Conclusão</label>
              <textarea
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                placeholder="CTA ou fechamento. Ex: Comenta QUERO que eu te ensino como fazer"
                className="input min-h-[56px] resize-y"
              />
            </div>
          </div>

          {/* Section: Classificação */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-text-secondary tracking-wide">Classificação</p>

            {/* Format */}
            <div>
              <label className="text-xs text-text-tertiary mb-1.5 block">Formato</label>
              <div className="flex flex-wrap gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={cn(
                      'badge transition-all cursor-pointer',
                      format === f
                        ? 'bg-accent-surface text-accent'
                        : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                    )}
                  >
                    {FORMAT_FILTER_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>

            {/* Pillar */}
            <div>
              <label className="text-xs text-text-tertiary mb-1.5 block">Pilar</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPillarId(null)}
                  className={cn(
                    'badge transition-all cursor-pointer',
                    !pillarId
                      ? 'bg-accent-surface text-accent'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                  )}
                >
                  Universal
                </button>
                {pillars.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPillarId(p.id)}
                    className={cn(
                      'badge transition-all cursor-pointer',
                      pillarId === p.id
                        ? 'text-white'
                        : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                    )}
                    style={
                      pillarId === p.id
                        ? { backgroundColor: p.color }
                        : undefined
                    }
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-text-tertiary mb-1.5 block">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.filter((c) => c !== 'ALL').map((c) => {
                  const colors = CATEGORY_COLORS[c] || { bg: 'var(--bg-secondary)', text: 'var(--text-tertiary)' };
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={cn(
                        'badge transition-all cursor-pointer',
                        category === c
                          ? ''
                          : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                      )}
                      style={
                        category === c
                          ? { backgroundColor: colors.bg, color: colors.text }
                          : undefined
                      }
                    >
                      {CATEGORY_LABELS[c]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-border-default">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 text-sm">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !text.trim()}
              className={cn(
                'btn-accent flex-1 flex items-center justify-center gap-2 text-sm',
                (saving || !text.trim()) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Ideia'
              )}
            </button>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
}
