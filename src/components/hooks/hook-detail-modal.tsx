'use client';

import { useState } from 'react';
import { Lightbulb, X, Loader2, Copy, ArrowRight, Check, Edit3, Trash2, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Hook, ContentPillar, PostFormat, HookCategory } from '@/types';
import { FORMAT_LABELS } from '@/types';
import { FORMATS, FORMAT_FILTER_LABELS, CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS } from './constants';

interface HookDetailModalProps {
  hook: Hook;
  pillars: ContentPillar[];
  pillarColor: string;
  pillarName: string;
  onClose: () => void;
  onCopy: (hook: Hook) => void;
  onUseInPost: (hook: Hook) => void;
  onDelete: (hookId: string) => void;
  onUpdate: (hookId: string, data: {
    text?: string;
    scenes?: string | null;
    conclusion?: string | null;
    pillarId?: string | null;
    format?: string;
    category?: string;
  }) => Promise<void>;
}

export function HookDetailModal({ hook, pillars, pillarColor, pillarName, onClose, onCopy, onUseInPost, onDelete, onUpdate }: HookDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editText, setEditText] = useState(hook.text);
  const [editScenes, setEditScenes] = useState(hook.scenes || '');
  const [editConclusion, setEditConclusion] = useState(hook.conclusion || '');
  const [editFormat, setEditFormat] = useState(hook.format);
  const [editCategory, setEditCategory] = useState(hook.category);
  const [editPillarId, setEditPillarId] = useState<string | null>(hook.pillarId);
  const catColors = CATEGORY_COLORS[hook.category] || { bg: 'var(--bg-secondary)', text: 'var(--text-tertiary)' };

  const handleCopy = async () => {
    await onCopy(hook);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEdit = () => {
    setEditText(hook.text);
    setEditScenes(hook.scenes || '');
    setEditConclusion(hook.conclusion || '');
    setEditFormat(hook.format);
    setEditCategory(hook.category);
    setEditPillarId(hook.pillarId);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      await onUpdate(hook.id, {
        text: editText.trim(),
        scenes: editScenes.trim() || null,
        conclusion: editConclusion.trim() || null,
        format: editFormat,
        category: editCategory,
        pillarId: editPillarId,
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const scenesLines = hook.scenes?.split('\n').filter((line) => line.trim()) || [];
  const conclusionLines = hook.conclusion?.split('\n').filter((line) => line.trim()) || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 animate-backdrop" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div
          className="relative bg-bg-modal border border-border-default rounded-2xl w-full max-w-xl animate-scale-in"
          style={{ boxShadow: 'var(--shadow-xl)' }}
        >
          <div className="max-h-[85vh] overflow-y-auto rounded-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-bg-modal rounded-t-2xl border-b border-border-default">
              <div className="flex items-start gap-3 p-4 sm:p-5">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0 mt-0.5"
                  style={{ backgroundColor: catColors.bg, color: catColors.text }}
                >
                  <Lightbulb size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className="badge text-[11px]"
                      style={{ backgroundColor: catColors.bg, color: catColors.text }}
                    >
                      {CATEGORY_LABELS[hook.category] || hook.category}
                    </span>
                    <span
                      className="badge text-[11px]"
                      style={{ backgroundColor: `${pillarColor}15`, color: pillarColor }}
                    >
                      {pillarName}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-text-primary leading-snug">
                    {isEditing ? 'Editando Ideia' : 'Ideia de Conteúdo'}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors text-text-tertiary shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
              {!isEditing && (
                <div className="flex items-center gap-2 px-4 sm:px-5 pb-4">
                  <button
                    onClick={() => onUseInPost(hook)}
                    className="btn-accent flex items-center gap-2 text-sm"
                  >
                    <ArrowRight size={14} />
                    Usar em Post
                  </button>
                  <button
                    onClick={handleCopy}
                    className={cn(
                      'btn-ghost flex items-center gap-2 text-sm',
                      copied && 'text-success'
                    )}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                  <button
                    onClick={handleStartEdit}
                    className="btn-ghost flex items-center gap-2 text-sm"
                  >
                    <Edit3 size={14} />
                    Editar
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => onDelete(hook.id)}
                    className="p-2 rounded-lg text-text-tertiary hover:bg-error-surface hover:text-error transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
              {isEditing && (
                <div className="flex items-center gap-2 px-4 sm:px-5 pb-4">
                  <button
                    onClick={handleSave}
                    disabled={saving || !editText.trim()}
                    className={cn(
                      'btn-accent flex items-center gap-2 text-sm',
                      (saving || !editText.trim()) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="btn-ghost flex items-center gap-2 text-sm"
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5 space-y-4">
              {isEditing ? (
                /* ===== EDIT MODE ===== */
                <>
                  {/* Gancho */}
                  <div>
                    <label className="text-xs font-semibold text-text-secondary mb-2 block">Gancho *</label>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="input min-h-[72px] resize-y"
                      autoFocus
                    />
                  </div>

                  {/* Cenas */}
                  <div>
                    <label className="text-xs font-semibold text-text-secondary mb-2 block">Cenas</label>
                    <textarea
                      value={editScenes}
                      onChange={(e) => setEditScenes(e.target.value)}
                      placeholder="Uma cena por linha"
                      className="input min-h-[120px] resize-y"
                    />
                    <p className="text-[11px] text-text-tertiary mt-1">Uma cena por linha</p>
                  </div>

                  {/* Conclusão */}
                  <div>
                    <label className="text-xs font-semibold text-text-secondary mb-2 block">Conclusão</label>
                    <textarea
                      value={editConclusion}
                      onChange={(e) => setEditConclusion(e.target.value)}
                      placeholder="CTA ou fechamento"
                      className="input min-h-[56px] resize-y"
                    />
                  </div>

                  {/* Formato */}
                  <div>
                    <label className="text-xs font-semibold text-text-secondary mb-2 block">Formato</label>
                    <div className="flex flex-wrap gap-2">
                      {FORMATS.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setEditFormat(f)}
                          className={cn(
                            'badge transition-all cursor-pointer',
                            editFormat === f
                              ? 'bg-accent-surface text-accent'
                              : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                          )}
                        >
                          {FORMAT_FILTER_LABELS[f]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Categoria */}
                  <div>
                    <label className="text-xs font-semibold text-text-secondary mb-2 block">Categoria</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.filter((c) => c !== 'ALL').map((c) => {
                        const colors = CATEGORY_COLORS[c] || { bg: 'var(--bg-secondary)', text: 'var(--text-tertiary)' };
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEditCategory(c as HookCategory)}
                            className={cn(
                              'badge transition-all cursor-pointer',
                              editCategory === c
                                ? ''
                                : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                            )}
                            style={editCategory === c ? { backgroundColor: colors.bg, color: colors.text } : undefined}
                          >
                            {CATEGORY_LABELS[c]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pilar */}
                  <div>
                    <label className="text-xs font-semibold text-text-secondary mb-2 block">Pilar</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setEditPillarId(null)}
                        className={cn(
                          'badge transition-all cursor-pointer',
                          !editPillarId
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
                          onClick={() => setEditPillarId(p.id)}
                          className={cn(
                            'badge transition-all cursor-pointer',
                            editPillarId === p.id
                              ? 'text-white'
                              : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                          )}
                          style={editPillarId === p.id ? { backgroundColor: p.color } : undefined}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* ===== VIEW MODE ===== */
                <>
                  {/* Formato */}
                  <div>
                    <p className="text-xs font-semibold text-text-secondary mb-2">Formato</p>
                    <div className="rounded-xl bg-bg-secondary p-3">
                      <p className="text-sm text-accent font-medium">
                        {FORMAT_LABELS[hook.format as PostFormat] || 'Todos os formatos'}
                      </p>
                    </div>
                  </div>

                  {/* Gancho */}
                  <div>
                    <p className="text-xs font-semibold text-text-secondary mb-2">Gancho</p>
                    <div className="rounded-xl bg-bg-secondary p-4">
                      <p className="text-sm text-text-primary leading-relaxed">{hook.text}</p>
                    </div>
                  </div>

                  {/* Cenas */}
                  <div>
                    <p className="text-xs font-semibold text-text-secondary mb-2">Cenas</p>
                    <div className="rounded-xl bg-bg-secondary p-4">
                      {scenesLines.length > 0 ? (
                        <div className="space-y-2">
                          {scenesLines.map((line, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-xs font-bold text-accent mt-0.5 shrink-0">{i + 1}.</span>
                              <p className="text-sm text-text-primary leading-relaxed">{line}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-text-tertiary italic">Nenhuma cena definida</p>
                      )}
                    </div>
                  </div>

                  {/* Conclusão */}
                  <div>
                    <p className="text-xs font-semibold text-text-secondary mb-2">Conclusão</p>
                    <div className="rounded-xl bg-bg-secondary p-4">
                      {conclusionLines.length > 0 ? (
                        <div className="space-y-2">
                          {conclusionLines.map((line, i) => (
                            <p key={i} className="text-sm text-text-primary leading-relaxed">{line}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-text-tertiary italic">Nenhuma conclusão definida</p>
                      )}
                    </div>
                  </div>

                  {/* Metadata row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-text-secondary mb-2">Categoria</p>
                      <div className="rounded-xl bg-bg-secondary p-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: catColors.text }} />
                          <p className="text-sm text-text-primary font-medium">
                            {CATEGORY_LABELS[hook.category] || hook.category}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-secondary mb-2">Pilar</p>
                      <div className="rounded-xl bg-bg-secondary p-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pillarColor }} />
                          <p className="text-sm text-text-primary font-medium">{pillarName}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Uso */}
                  <div>
                    <p className="text-xs font-semibold text-text-secondary mb-2">Uso</p>
                    <div className="rounded-xl bg-bg-secondary p-3 flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ backgroundColor: 'var(--accent-surface)' }}
                      >
                        <Hash size={14} className="text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{hook.usageCount}x utilizado</p>
                        <p className="text-[11px] text-text-tertiary">
                          {hook.usageCount === 0
                            ? 'Ainda não foi usado em nenhum post'
                            : `Usado em ${hook.usageCount} post${hook.usageCount > 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
