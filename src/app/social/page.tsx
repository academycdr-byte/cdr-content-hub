'use client';

import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Share2, Instagram, Music2 } from 'lucide-react';
import { useSocialStore } from '@/stores/social-store';
import { useToastStore } from '@/stores/toast-store';
import { useTokenRefresh } from '@/hooks/use-token-refresh';
import ConnectButton from '@/components/social/connect-button';
import AccountCard from '@/components/social/account-card';

export default function SocialPage() {
  const { addToast } = useToastStore();
  const {
    accounts,
    loading,
    syncingId,
    fetchAccounts,
    syncAccount,
    disconnectAccount,
    toggleAutoSync,
  } = useSocialStore();

  // Auto-refresh expiring Instagram tokens silently
  useTokenRefresh();

  const searchParams = useSearchParams();

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Handle OAuth callback redirect params
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const count = searchParams.get('count');

    if (success === 'instagram') {
      addToast(
        count
          ? `Instagram conectado! ${count} conta${Number(count) !== 1 ? 's' : ''} encontrada${Number(count) !== 1 ? 's' : ''}.`
          : 'Instagram conectado com sucesso!',
        'success'
      );
      window.history.replaceState({}, '', '/social');
      fetchAccounts();
    } else if (success === 'tiktok') {
      addToast('TikTok conectado com sucesso!', 'success');
      window.history.replaceState({}, '', '/social');
      fetchAccounts();
    } else if (error) {
      addToast(decodeURIComponent(error), 'error');
      window.history.replaceState({}, '', '/social');
    }
  }, [searchParams, addToast, fetchAccounts]);

  const handleSync = useCallback(
    async (accountId: string) => {
      const account = accounts.find((a) => a.id === accountId);
      if (!account) return;

      const result = await syncAccount(accountId, account.platform);
      if (result.success) {
        addToast(`Sincronizado: ${result.synced} itens.`, 'success');
      } else {
        addToast(result.error || 'Erro ao sincronizar', 'error');
      }
    },
    [accounts, syncAccount, addToast]
  );

  const handleDisconnect = useCallback(
    async (accountId: string) => {
      const confirmed = window.confirm(
        'Desconectar esta conta? Os dados sincronizados serao mantidos.'
      );
      if (!confirmed) return;

      const success = await disconnectAccount(accountId);
      if (success) {
        addToast('Conta desconectada.', 'success');
      } else {
        addToast('Erro ao desconectar conta.', 'error');
      }
    },
    [disconnectAccount, addToast]
  );

  const handleToggleAutoSync = useCallback(
    async (accountId: string, enabled: boolean) => {
      const success = await toggleAutoSync(accountId, enabled);
      if (success) {
        addToast(
          enabled
            ? 'Auto-sync ativado. Posts serao sincronizados a cada 15 minutos.'
            : 'Auto-sync desativado.',
          enabled ? 'success' : 'info'
        );
      } else {
        addToast('Erro ao alterar auto-sync.', 'error');
      }
    },
    [toggleAutoSync, addToast]
  );

  const instagramAccounts = accounts.filter(
    (a) => a.platform === 'instagram'
  );
  const tiktokAccounts = accounts.filter((a) => a.platform === 'tiktok');

  const autoSyncCount = accounts.filter((a) => a.autoSync).length;

  // Loading skeleton
  if (loading && accounts.length === 0) {
    return (
      <div className="max-w-5xl mx-auto animate-fade-in">
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="skeleton h-4 w-64 mb-8" />
        <div className="skeleton h-16 w-full mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-[200px]" />
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
          <h1 className="text-heading-1 text-text-primary mb-1">
            Contas Sociais
          </h1>
          <p className="text-sm text-text-secondary">
            {accounts.length} conta{accounts.length !== 1 ? 's' : ''}{' '}
            conectada{accounts.length !== 1 ? 's' : ''}
            {autoSyncCount > 0 && (
              <span className="ml-2 text-success font-medium">
                ({autoSyncCount} com auto-sync)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Connect Buttons */}
      <div className="card p-5 mb-8">
        <h2 className="text-heading-3 text-text-primary mb-3">
          Conectar Nova Conta
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Conecte suas redes sociais para sincronizar conteudo automaticamente.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <ConnectButton platform="instagram" />
          <ConnectButton platform="tiktok" />
        </div>
      </div>

      {/* Connected Accounts */}
      {accounts.length === 0 ? (
        <div className="card p-16 flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-surface mb-4">
            <Share2 size={28} className="text-accent" />
          </div>
          <h2 className="text-heading-2 text-text-primary mb-2">
            Nenhuma conta conectada
          </h2>
          <p className="text-sm text-text-secondary max-w-md">
            Conecte seu Instagram ou TikTok para sincronizar postagens
            automaticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Instagram */}
          {instagramAccounts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]">
                  <Instagram className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Instagram
                </h2>
                <span className="badge bg-accent-surface text-accent">
                  {instagramAccounts.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                {instagramAccounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    syncing={syncingId === account.id}
                    onSync={handleSync}
                    onDisconnect={handleDisconnect}
                    onToggleAutoSync={handleToggleAutoSync}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TikTok */}
          {tiktokAccounts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-text-primary">
                  <Music2 className="w-4 h-4 text-bg-primary" />
                </div>
                <h2 className="text-lg font-semibold text-text-primary">
                  TikTok
                </h2>
                <span className="badge bg-accent-surface text-accent">
                  {tiktokAccounts.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                {tiktokAccounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    syncing={syncingId === account.id}
                    onSync={handleSync}
                    onDisconnect={handleDisconnect}
                    onToggleAutoSync={handleToggleAutoSync}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
