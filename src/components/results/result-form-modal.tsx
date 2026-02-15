'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Trophy, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MetricType } from '@/types';
import type { ClientResult } from '@/types';

interface ResultFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ResultFormData) => Promise<void>;
  editingResult?: ClientResult | null;
}

export interface ResultFormData {
  clientName: string;
  clientNiche: string;
  metricType: string;
  metricValue: string;
  metricUnit: string;
  period: string;
  description: string;
  testimonialText: string;
  imageUrls: { url: string; altText: string; type: string }[];
}

const METRIC_OPTIONS = [
  { value: MetricType.ROAS, label: 'ROAS', unit: 'x' },
  { value: MetricType.REVENUE, label: 'Faturamento', unit: 'R$' },
  { value: MetricType.GROWTH, label: 'Crescimento', unit: '%' },
  { value: MetricType.CAC, label: 'CAC', unit: 'R$' },
  { value: MetricType.OTHER, label: 'Outro', unit: '' },
] as const;

const NICHE_SUGGESTIONS = [
  'E-commerce Moda',
  'E-commerce Suplementos',
  'E-commerce Cosmeticos',
  'E-commerce Eletronicos',
  'SaaS',
  'Infoprodutos',
  'Varejo',
  'Servicos',
] as const;

const INITIAL_FORM: ResultFormData = {
  clientName: '',
  clientNiche: '',
  metricType: 'ROAS',
  metricValue: '',
  metricUnit: '',
  period: '',
  description: '',
  testimonialText: '',
  imageUrls: [],
};

export default function ResultFormModal({ isOpen, onClose, onSubmit, editingResult }: ResultFormModalProps) {
  const [form, setForm] = useState<ResultFormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingResult) {
      setForm({
        clientName: editingResult.clientName,
        clientNiche: editingResult.clientNiche,
        metricType: editingResult.metricType,
        metricValue: editingResult.metricValue,
        metricUnit: editingResult.metricUnit,
        period: editingResult.period,
        description: editingResult.description,
        testimonialText: editingResult.testimonialText || '',
        imageUrls: editingResult.images?.map((img) => ({
          url: img.url,
          altText: img.altText,
          type: img.type,
        })) || [],
      });
    } else {
      setForm(INITIAL_FORM);
    }
  }, [editingResult, isOpen]);

  const handleChange = useCallback((field: keyof ResultFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Auto-fill unit when metric type changes
  const handleMetricTypeChange = useCallback((value: string) => {
    const option = METRIC_OPTIONS.find((o) => o.value === value);
    setForm((prev) => ({
      ...prev,
      metricType: value,
      metricUnit: prev.metricUnit || (option?.unit ?? ''),
    }));
  }, []);

  const handleAddImage = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, { url: '', altText: '', type: 'SCREENSHOT' }],
    }));
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  }, []);

  const handleImageChange = useCallback((index: number, field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.map((img, i) =>
        i === index ? { ...img, [field]: value } : img
      ),
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
      setForm(INITIAL_FORM);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = form.clientName && form.clientNiche && form.metricType && form.metricValue && form.period;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 animate-backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-bg-card border border-border-default rounded-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto animate-scale-in mx-3 my-4 sm:my-0"
        style={{ boxShadow: 'var(--shadow-xl)' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 p-4 sm:p-5 border-b border-border-default bg-bg-card rounded-t-2xl">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
            style={{ backgroundColor: 'rgba(184, 255, 0, 0.12)' }}
          >
            <Trophy size={18} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-text-primary">
              {editingResult ? 'Editar Resultado' : 'Novo Resultado'}
            </h2>
            <p className="text-xs text-text-tertiary">
              Cadastre um case de sucesso do seu cliente
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors text-text-tertiary"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5">
          {/* Section: Cliente */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-text-secondary tracking-wide">Cliente</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">Nome *</label>
                <input
                  type="text"
                  value={form.clientName}
                  onChange={(e) => handleChange('clientName', e.target.value)}
                  placeholder="Ex: Loja XYZ"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">Nicho *</label>
                <input
                  type="text"
                  value={form.clientNiche}
                  onChange={(e) => handleChange('clientNiche', e.target.value)}
                  placeholder="Ex: E-commerce Moda"
                  className="input"
                  list="niche-suggestions"
                  required
                />
                <datalist id="niche-suggestions">
                  {NICHE_SUGGESTIONS.map((niche) => (
                    <option key={niche} value={niche} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Section: Metrica */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-text-secondary tracking-wide">Metrica Principal</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs text-text-tertiary mb-1 block">Tipo *</label>
                <div className="relative">
                  <select
                    value={form.metricType}
                    onChange={(e) => handleMetricTypeChange(e.target.value)}
                    className="input pr-8 appearance-none cursor-pointer"
                    required
                  >
                    {METRIC_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">Valor *</label>
                <input
                  type="text"
                  value={form.metricValue}
                  onChange={(e) => handleChange('metricValue', e.target.value)}
                  placeholder="8.5"
                  className="input font-semibold"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">Unidade</label>
                <input
                  type="text"
                  value={form.metricUnit}
                  onChange={(e) => handleChange('metricUnit', e.target.value)}
                  placeholder="x, %, R$"
                  className="input"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs text-text-tertiary mb-1 block">Periodo *</label>
                <input
                  type="text"
                  value={form.period}
                  onChange={(e) => handleChange('period', e.target.value)}
                  placeholder="3 meses"
                  className="input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section: Detalhes */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-text-secondary tracking-wide">Detalhes (opcional)</p>
            <div>
              <label className="text-xs text-text-tertiary mb-1 block">Descricao</label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Contexto, estrategia utilizada, desafios superados..."
                className="input min-h-[72px] resize-y"
                rows={2}
              />
            </div>
            <div>
              <label className="text-xs text-text-tertiary mb-1 block">Depoimento do cliente</label>
              <textarea
                value={form.testimonialText}
                onChange={(e) => handleChange('testimonialText', e.target.value)}
                placeholder="Feedback ou depoimento do cliente..."
                className="input min-h-[72px] resize-y"
                rows={2}
              />
            </div>
          </div>

          {/* Section: Imagens */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text-secondary tracking-wide">Evidencias (opcional)</p>
              <button
                type="button"
                onClick={handleAddImage}
                className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
              >
                <Plus size={12} />
                Adicionar URL
              </button>
            </div>

            {form.imageUrls.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-default p-4 text-center">
                <p className="text-xs text-text-tertiary">
                  Adicione screenshots ou evidencias dos resultados
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {form.imageUrls.map((img, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="url"
                      value={img.url}
                      onChange={(e) => handleImageChange(index, 'url', e.target.value)}
                      placeholder="https://..."
                      className="input flex-1 text-xs"
                    />
                    <input
                      type="text"
                      value={img.altText}
                      onChange={(e) => handleImageChange(index, 'altText', e.target.value)}
                      placeholder="Descricao"
                      className="input w-28 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="p-2 rounded-lg hover:bg-error-surface text-text-tertiary hover:text-error transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-default">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost text-sm"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={cn(
                'btn-accent text-sm',
                (!isValid || submitting) && 'opacity-50 cursor-not-allowed'
              )}
              disabled={!isValid || submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </span>
              ) : editingResult ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
