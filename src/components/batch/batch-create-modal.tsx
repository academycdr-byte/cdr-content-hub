'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface BatchCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BatchCreateData) => Promise<void>;
}

export interface BatchCreateData {
  title: string;
  scheduledDate: string;
  notes: string;
}

export default function BatchCreateModal({ isOpen, onClose, onSubmit }: BatchCreateModalProps) {
  const [title, setTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ title, scheduledDate, notes });
      setTitle('');
      setScheduledDate('');
      setNotes('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-bg-card border border-border-default rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] w-full max-w-lg animate-scale-in mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-default">
          <h2 className="text-heading-2 text-text-primary">Nova Sessao de Gravacao</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] hover:bg-bg-hover transition-colors text-text-tertiary"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-label text-text-secondary mb-1.5 block">
              Titulo *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Batch Reels Semana 1 Fev"
              className="input"
              required
            />
          </div>

          <div>
            <label className="text-label text-text-secondary mb-1.5 block">
              Data de Gravacao *
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="text-label text-text-secondary mb-1.5 block">
              Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Local de gravacao, equipamentos, observacoes..."
              className="input min-h-[80px] resize-y"
              rows={3}
            />
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
              disabled={!title || !scheduledDate || submitting}
            >
              {submitting ? 'Criando...' : 'Criar Sessao'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
