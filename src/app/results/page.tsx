'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Plus, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResultsStore } from '@/stores/results-store';
import { useToastStore } from '@/stores/toast-store';
import { MetricType } from '@/types';
import type { ClientResult } from '@/types';
import ResultCard from '@/components/results/result-card';
import ResultFormModal from '@/components/results/result-form-modal';
import type { ResultFormData } from '@/components/results/result-form-modal';

const METRIC_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: MetricType.ROAS, label: 'ROAS' },
  { value: MetricType.REVENUE, label: 'Faturamento' },
  { value: MetricType.GROWTH, label: 'Crescimento' },
  { value: MetricType.CAC, label: 'CAC' },
  { value: MetricType.OTHER, label: 'Outro' },
] as const;

export default function ResultsPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const {
    results,
    loading,
    page,
    totalPages,
    total,
    filters,
    setFilters,
    setPage,
    fetchResults,
    createResult,
    updateResult,
    deleteResult,
  } = useResultsStore();

  const [showModal, setShowModal] = useState(false);
  const [editingResult, setEditingResult] = useState<ClientResult | null>(null);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleSearch = useCallback(() => {
    setFilters({ clientName: searchInput });
  }, [searchInput, setFilters]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleCreate = useCallback(() => {
    setEditingResult(null);
    setShowModal(true);
  }, []);

  const handleEdit = useCallback((result: ClientResult) => {
    setEditingResult(result);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const confirmed = window.confirm('Tem certeza que deseja excluir este resultado?');
    if (!confirmed) return;

    const success = await deleteResult(id);
    if (success) {
      addToast('Resultado excluido com sucesso.', 'success');
    } else {
      addToast('Erro ao excluir resultado.', 'error');
    }
  }, [deleteResult, addToast]);

  const handleTransformToPost = useCallback(async (result: ClientResult) => {
    try {
      // Fetch pillars to find "case-studies" pillar
      const pillarsRes = await fetch('/api/pillars');
      if (!pillarsRes.ok) throw new Error('Failed to fetch pillars');

      interface PillarData {
        id: string;
        slug: string;
      }

      const pillars = await pillarsRes.json() as PillarData[];
      const caseStudyPillar = pillars.find(
        (p) => p.slug === 'case-studies' || p.slug === 'casos-de-sucesso'
      );

      if (!caseStudyPillar) {
        addToast('Pilar "Case Studies" nao encontrado. Crie o pilar primeiro.', 'error');
        return;
      }

      // Build carousel body
      const slides: Record<string, string> = {
        cover: `${result.metricValue}${result.metricUnit} de ${result.metricType} para ${result.clientName}`,
        slide1: `Contexto: ${result.clientName} - ${result.clientNiche}\n\nDesafio: ${result.description || 'Descreva o desafio enfrentado pelo cliente'}`,
        slide2: 'Estrategia utilizada:\n\n1. [Preencha o passo 1]\n2. [Preencha o passo 2]\n3. [Preencha o passo 3]',
        slide3: 'Framework aplicado:\n\n[Detalhe o framework ou metodologia usada]',
        slide4: 'Execucao:\n\n[Descreva como foi a implementacao]',
        slide5: `Resultado:\n\n${result.metricValue}${result.metricUnit} de ${result.metricType} em ${result.period}`,
      };

      if (result.testimonialText) {
        slides.slide6 = `Depoimento do cliente:\n\n"${result.testimonialText}"`;
        slides.slide7 = 'Quer resultados assim para o seu e-commerce?\n\nComente "QUERO" ou mande um DM.';
      } else {
        slides.slide6 = 'Quer resultados assim para o seu e-commerce?\n\nComente "QUERO" ou mande um DM.';
      }

      slides.cta = 'Siga @cdrgroup para mais cases como esse!';

      const title = `Como geramos ${result.metricValue}${result.metricUnit} de ${result.metricType} para ${result.clientName} em ${result.period}`;

      const postRes = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          format: 'CAROUSEL',
          pillarId: caseStudyPillar.id,
          status: 'SCRIPT',
          body: JSON.stringify(slides),
        }),
      });

      if (!postRes.ok) throw new Error('Failed to create post');

      interface PostData {
        id: string;
      }

      const post = await postRes.json() as PostData;
      addToast('Case study criado! Complete o roteiro.', 'success');
      router.push(`/posts/${post.id}`);
    } catch (error) {
      console.error('Failed to transform result:', error instanceof Error ? error.message : 'Unknown');
      addToast('Erro ao criar case study.', 'error');
    }
  }, [addToast, router]);

  const handleFormSubmit = useCallback(async (data: ResultFormData) => {
    if (editingResult) {
      const result = await updateResult(editingResult.id, {
        ...data,
        testimonialText: data.testimonialText || null,
      });
      if (result) {
        addToast('Resultado atualizado com sucesso!', 'success');
      } else {
        addToast('Erro ao atualizar resultado.', 'error');
      }
    } else {
      const result = await createResult(data);
      if (result) {
        addToast('Resultado cadastrado com sucesso!', 'success');
      } else {
        addToast('Erro ao cadastrar resultado.', 'error');
      }
    }
  }, [editingResult, createResult, updateResult, addToast]);

  const hasActiveFilters = filters.clientName || filters.metricType || filters.clientNiche;

  // Loading skeleton
  if (loading && results.length === 0) {
    return (
      <div className="max-w-5xl mx-auto animate-fade-in">
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="skeleton h-4 w-64 mb-8" />
        <div className="skeleton h-12 w-full mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-[240px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-heading-1 text-text-primary mb-1">Resultados</h1>
          <p className="text-sm text-text-secondary">
            {total} resultado{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={handleCreate} className="btn-accent flex items-center gap-2">
          <Plus size={16} />
          <span>Novo Resultado</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card p-3 mb-6 flex items-center gap-3 flex-wrap">
        <Filter size={14} className="text-text-tertiary shrink-0" />

        {/* Search by client name */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={handleSearch}
            placeholder="Buscar por cliente..."
            className="input py-1.5 pl-8 pr-3 text-xs"
          />
        </div>

        {/* Metric type filter */}
        <select
          value={filters.metricType}
          onChange={(e) => setFilters({ metricType: e.target.value })}
          className={cn(
            'input py-1.5 px-3 text-xs w-auto min-w-[140px]',
            filters.metricType && 'border-accent'
          )}
        >
          {METRIC_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Niche filter */}
        <input
          type="text"
          value={filters.clientNiche}
          onChange={(e) => setFilters({ clientNiche: e.target.value })}
          placeholder="Filtrar por nicho..."
          className={cn(
            'input py-1.5 px-3 text-xs w-auto min-w-[140px]',
            filters.clientNiche && 'border-accent'
          )}
        />

        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearchInput('');
              setFilters({ clientName: '', metricType: '', clientNiche: '' });
            }}
            className="text-xs text-accent hover:text-accent-hover font-medium transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Results Grid */}
      {results.length === 0 ? (
        <div className="card p-16 flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-surface mb-4">
            <Trophy size={28} className="text-accent" />
          </div>
          <h2 className="text-heading-2 text-text-primary mb-2">
            {hasActiveFilters ? 'Nenhum resultado encontrado' : 'Nenhum resultado cadastrado'}
          </h2>
          <p className="text-sm text-text-secondary max-w-md mb-4">
            {hasActiveFilters
              ? 'Tente ajustar os filtros para encontrar o que procura.'
              : 'Cadastre resultados de clientes para criar case studies incriveis.'}
          </p>
          {!hasActiveFilters && (
            <button onClick={handleCreate} className="btn-accent flex items-center gap-2">
              <Plus size={16} />
              <span>Cadastrar Primeiro Resultado</span>
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {results.map((result) => (
              <ResultCard
                key={result.id}
                result={result}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTransformToPost={handleTransformToPost}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className={cn(
                  'btn-ghost flex items-center gap-1 text-xs py-2 px-3',
                  page <= 1 && 'opacity-50 cursor-not-allowed'
                )}
              >
                <ChevronLeft size={14} />
                Anterior
              </button>

              <span className="text-sm text-text-secondary">
                Pagina {page} de {totalPages}
              </span>

              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className={cn(
                  'btn-ghost flex items-center gap-1 text-xs py-2 px-3',
                  page >= totalPages && 'opacity-50 cursor-not-allowed'
                )}
              >
                Proxima
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <ResultFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingResult(null);
        }}
        onSubmit={handleFormSubmit}
        editingResult={editingResult}
      />
    </div>
  );
}
