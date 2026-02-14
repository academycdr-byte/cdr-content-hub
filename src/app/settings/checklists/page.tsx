'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, Plus, X, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/stores/toast-store';
import { STATUS_LABELS, type PostStatus } from '@/types';

interface ChecklistTemplateData {
  id: string;
  stage: string;
  items: string[];
}

const STATUS_COLORS: Record<string, string> = {
  SCRIPT: '#7C3AED',
  PRODUCTION: '#2563EB',
  REVIEW: '#D97706',
  SCHEDULED: '#16A34A',
};

export default function ChecklistsSettingsPage() {
  const [templates, setTemplates] = useState<ChecklistTemplateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToastStore();

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const res = await fetch('/api/checklists/templates');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json() as ChecklistTemplateData[];
      setTemplates(data);
    } catch {
      addToast('Erro ao carregar checklists', 'error');
    } finally {
      setLoading(false);
    }
  }

  function updateItem(templateIndex: number, itemIndex: number, value: string) {
    setTemplates((prev) =>
      prev.map((t, ti) =>
        ti === templateIndex
          ? {
              ...t,
              items: t.items.map((item, ii) => (ii === itemIndex ? value : item)),
            }
          : t
      )
    );
  }

  function addItem(templateIndex: number) {
    setTemplates((prev) =>
      prev.map((t, ti) =>
        ti === templateIndex
          ? { ...t, items: [...t.items, ''] }
          : t
      )
    );
  }

  function removeItem(templateIndex: number, itemIndex: number) {
    setTemplates((prev) =>
      prev.map((t, ti) =>
        ti === templateIndex
          ? { ...t, items: t.items.filter((_, ii) => ii !== itemIndex) }
          : t
      )
    );
  }

  async function handleSave() {
    // Validate: no empty items
    const hasEmpty = templates.some((t) => t.items.some((item) => !item.trim()));
    if (hasEmpty) {
      addToast('Remova items vazios antes de salvar', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/checklists/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templates),
      });

      if (!res.ok) throw new Error('Failed to save');

      addToast('Checklists atualizadas com sucesso!', 'success');
    } catch (error) {
      addToast(
        `Erro ao salvar: ${error instanceof Error ? error.message : 'Unknown'}`,
        'error'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading-1 text-text-primary">Checklists por Etapa</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Configure os items de checklist para cada etapa do pipeline de producao.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-accent flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save size={16} />
              Salvar
            </>
          )}
        </button>
      </div>

      {/* Templates */}
      <div className="space-y-6">
        {templates.map((template, templateIndex) => {
          const statusColor = STATUS_COLORS[template.stage] || '#6E6E73';

          return (
            <div key={template.id} className="card p-6">
              {/* Stage Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${statusColor}15` }}
                >
                  <CheckSquare size={16} style={{ color: statusColor }} />
                </div>
                <div>
                  <h3 className="text-heading-3 text-text-primary">
                    {STATUS_LABELS[template.stage as PostStatus] || template.stage}
                  </h3>
                  <p className="text-xs text-text-tertiary">
                    {template.items.length} item{template.items.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {template.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center gap-2">
                    <div className="flex h-4 w-4 items-center justify-center text-text-tertiary shrink-0">
                      <span className="text-[10px] font-mono">{itemIndex + 1}.</span>
                    </div>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateItem(templateIndex, itemIndex, e.target.value)}
                      placeholder="Item da checklist..."
                      className="input py-2 text-sm flex-1"
                    />
                    <button
                      onClick={() => removeItem(templateIndex, itemIndex)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-text-tertiary hover:bg-error-surface hover:text-error transition-colors shrink-0"
                      title="Remover item"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Item */}
              <button
                onClick={() => addItem(templateIndex)}
                className={cn(
                  'mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                  'text-text-tertiary hover:text-accent hover:bg-accent-surface'
                )}
              >
                <Plus size={14} />
                Adicionar item
              </button>
            </div>
          );
        })}
      </div>

      {/* Settings Navigation */}
      <div className="mt-8 pt-6 border-t border-border-default">
        <p className="text-label text-text-tertiary mb-3">Configuracoes</p>
        <div className="flex gap-3">
          <a
            href="/settings/pillars"
            className="badge bg-bg-secondary text-text-secondary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            Pilares de Conteudo
          </a>
          <span className="badge bg-accent-surface text-accent">
            Checklists
          </span>
        </div>
      </div>
    </div>
  );
}
