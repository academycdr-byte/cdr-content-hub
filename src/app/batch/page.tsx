'use client';

import { useEffect, useState, useCallback } from 'react';
import { Layers, Plus } from 'lucide-react';
import { useBatchStore } from '@/stores/batch-store';
import { useToastStore } from '@/stores/toast-store';
import BatchSessionCard from '@/components/batch/batch-session-card';
import BatchCreateModal from '@/components/batch/batch-create-modal';
import BatchSessionDetail from '@/components/batch/batch-session-detail';
import type { BatchCreateData } from '@/components/batch/batch-create-modal';

export default function BatchPage() {
  const { sessions, loading, fetchSessions, createSession, selectSession } = useBatchStore();
  const { addToast } = useToastStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCreate = useCallback(async (data: BatchCreateData) => {
    const session = await createSession(data);

    if (session) {
      addToast('Sessao criada com sucesso!', 'success');
    } else {
      addToast('Erro ao criar sessao.', 'error');
    }
  }, [createSession, addToast]);

  const handleViewSession = useCallback((sessionId: string) => {
    setViewingSessionId(sessionId);
  }, []);

  const handleBack = useCallback(() => {
    setViewingSessionId(null);
    selectSession(null);
    fetchSessions();
  }, [selectSession, fetchSessions]);

  // If viewing a session detail
  if (viewingSessionId) {
    return (
      <div className="max-w-5xl mx-auto">
        <BatchSessionDetail
          sessionId={viewingSessionId}
          onBack={handleBack}
        />
      </div>
    );
  }

  // Loading skeleton
  if (loading && sessions.length === 0) {
    return (
      <div className="max-w-5xl mx-auto animate-fade-in">
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="skeleton h-4 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-[160px]" />
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
          <h1 className="text-heading-1 text-text-primary mb-1">Batch Planner</h1>
          <p className="text-sm text-text-secondary">
            {sessions.length} sessao(oes) de gravacao
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-accent flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Nova Sessao</span>
        </button>
      </div>

      {/* Sessions grid */}
      {sessions.length === 0 ? (
        <div className="card p-16 flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-surface mb-4">
            <Layers size={28} className="text-accent" />
          </div>
          <h2 className="text-heading-2 text-text-primary mb-2">
            Nenhuma sessao criada
          </h2>
          <p className="text-sm text-text-secondary max-w-md mb-4">
            Crie sessoes de gravacao para organizar seus posts em batches e gravar tudo de uma vez.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-accent flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Criar Primeira Sessao</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {sessions.map((session) => (
            <BatchSessionCard
              key={session.id}
              session={session}
              onClick={() => handleViewSession(session.id)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <BatchCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
