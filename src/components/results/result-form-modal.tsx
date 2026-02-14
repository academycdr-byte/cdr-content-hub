'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
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
  { value: MetricType.ROAS, label: 'ROAS' },
  { value: MetricType.REVENUE, label: 'Faturamento' },
  { value: MetricType.GROWTH, label: 'Crescimento' },
  { value: MetricType.CAC, label: 'CAC' },
  { value: MetricType.OTHER, label: 'Outro' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-bg-card border border-border-default rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-default">
          <h2 className="text-heading-2 text-text-primary">
            {editingResult ? 'Editar Resultado' : 'Novo Resultado'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] hover:bg-bg-hover transition-colors text-text-tertiary"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Client Name */}
          <div>
            <label className="text-label text-text-secondary mb-1.5 block">
              Nome do Cliente *
            </label>
            <input
              type="text"
              value={form.clientName}
              onChange={(e) => handleChange('clientName', e.target.value)}
              placeholder="Ex: Loja XYZ"
              className="input"
              required
            />
          </div>

          {/* Client Niche */}
          <div>
            <label className="text-label text-text-secondary mb-1.5 block">
              Nicho *
            </label>
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

          {/* Metric Type + Value + Unit row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-label text-text-secondary mb-1.5 block">
                Tipo de Metrica *
              </label>
              <select
                value={form.metricType}
                onChange={(e) => handleChange('metricType', e.target.value)}
                className="input"
                required
              >
                {METRIC_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-label text-text-secondary mb-1.5 block">
                Valor *
              </label>
              <input
                type="text"
                value={form.metricValue}
                onChange={(e) => handleChange('metricValue', e.target.value)}
                placeholder="Ex: 8.5"
                className="input"
                required
              />
            </div>
            <div>
              <label className="text-label text-text-secondary mb-1.5 block">
                Unidade
              </label>
              <input
                type="text"
                value={form.metricUnit}
                onChange={(e) => handleChange('metricUnit', e.target.value)}
                placeholder="Ex: x, %, R$"
                className="input"
              />
            </div>
          </div>

          {/* Period */}
          <div>
            <label className="text-label text-text-secondary mb-1.5 block">
              Periodo *
            </label>
            <input
              type="text"
              value={form.period}
              onChange={(e) => handleChange('period', e.target.value)}
              placeholder="Ex: 3 meses, 90 dias, Q4 2025"
              className="input"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-label text-text-secondary mb-1.5 block">
              Descricao
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Contexto sobre o resultado, estrategia utilizada, desafios..."
              className="input min-h-[80px] resize-y"
              rows={3}
            />
          </div>

          {/* Testimonial */}
          <div>
            <label className="text-label text-text-secondary mb-1.5 block">
              Depoimento do Cliente
            </label>
            <textarea
              value={form.testimonialText}
              onChange={(e) => handleChange('testimonialText', e.target.value)}
              placeholder="Depoimento ou feedback do cliente sobre os resultados..."
              className="input min-h-[80px] resize-y"
              rows={3}
            />
          </div>

          {/* Image URLs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-label text-text-secondary">
                Imagens (URLs)
              </label>
              <button
                type="button"
                onClick={handleAddImage}
                className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  'text-accent hover:text-accent-hover transition-colors'
                )}
              >
                <Plus size={12} />
                Adicionar URL
              </button>
            </div>

            {form.imageUrls.length === 0 && (
              <p className="text-xs text-text-tertiary italic">
                Nenhuma imagem adicionada. Clique em &quot;Adicionar URL&quot; para incluir screenshots ou evidencias.
              </p>
            )}

            <div className="space-y-2">
              {form.imageUrls.map((img, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={img.url}
                    onChange={(e) => handleImageChange(index, 'url', e.target.value)}
                    placeholder="https://exemplo.com/imagem.png"
                    className="input flex-1"
                  />
                  <input
                    type="text"
                    value={img.altText}
                    onChange={(e) => handleImageChange(index, 'altText', e.target.value)}
                    placeholder="Descricao"
                    className="input w-32"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="p-2 rounded-[var(--radius-sm)] hover:bg-error-surface text-text-tertiary hover:text-error transition-colors shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-default">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-accent"
              disabled={!isValid || submitting}
            >
              {submitting ? 'Salvando...' : editingResult ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
