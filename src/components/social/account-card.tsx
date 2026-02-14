'use client';

import { Instagram, Music2, Users, RefreshCw, Unlink, LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SocialAccount } from '@/types';

interface AccountCardProps {
  account: SocialAccount;
  syncing: boolean;
  onSync: (id: string) => void;
  onDisconnect: (id: string) => void;
}

function getHealthStatus(account: SocialAccount): 'connected' | 'expiring' | 'expired' {
  const isInstagram = account.platform === 'instagram';
  const expiresAt = isInstagram
    ? account.tokenExpiresAt
    : account.tiktokExpiresAt;

  if (!expiresAt) return 'connected';

  const expiryDate = new Date(expiresAt);
  const now = new Date();

  if (expiryDate < now) return 'expired';

  // Warn if expiring within 7 days (Instagram only -- TikTok auto-refreshes)
  if (isInstagram) {
    const diff = expiryDate.getTime() - now.getTime();
    if (diff < 7 * 24 * 60 * 60 * 1000) return 'expiring';
  }

  return 'connected';
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Nunca';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Agora mesmo';
  if (diffMin < 60) return `${diffMin}min atras`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h atras`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d atras`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

const HEALTH_STYLES = {
  connected: {
    dot: 'bg-success',
    text: 'text-success',
    label: 'Conectada',
  },
  expiring: {
    dot: 'bg-warning',
    text: 'text-warning',
    label: 'Token expirando',
  },
  expired: {
    dot: 'bg-error',
    text: 'text-error',
    label: 'Token expirado',
  },
} as const;

export default function AccountCard({
  account,
  syncing,
  onSync,
  onDisconnect,
}: AccountCardProps) {
  const isInstagram = account.platform === 'instagram';
  const health = getHealthStatus(account);
  const healthStyle = HEALTH_STYLES[health];

  return (
    <div className="card card-hover p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Platform icon */}
          <div
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
              isInstagram
                ? 'bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]'
                : 'bg-text-primary'
            )}
          >
            {isInstagram ? (
              <Instagram className="w-5 h-5 text-white" />
            ) : (
              <Music2 className="w-5 h-5 text-bg-primary" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate text-text-primary">
              {account.displayName}
            </h3>
            <p className="text-xs truncate text-text-tertiary">
              @{account.username}
            </p>
          </div>
        </div>

        {/* Health indicator */}
        <div className="flex items-center gap-1.5">
          <div className={cn('w-2 h-2 rounded-full', healthStyle.dot)} />
          <span className={cn('text-xs font-medium', healthStyle.text)}>
            {healthStyle.label}
          </span>
        </div>
      </div>

      {/* Followers */}
      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-text-tertiary" />
          <span className="text-sm font-semibold text-text-primary">
            {formatFollowers(account.followersCount)}
          </span>
          <span className="text-xs text-text-tertiary">seguidores</span>
        </div>
      </div>

      {/* Last sync */}
      {account.lastSyncAt && (
        <p className="text-xs mt-2 text-text-tertiary">
          Ultimo sync: {formatRelativeTime(account.lastSyncAt)}
        </p>
      )}

      {/* Token expiry warning */}
      {health === 'expiring' && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-warning-surface text-warning text-xs font-medium">
          Token expira em breve. Sera renovado automaticamente.
        </div>
      )}
      {health === 'expired' && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-error-surface text-error text-xs font-medium">
          Token expirado. Reconecte a conta para continuar sincronizando.
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-border-default flex items-center gap-2">
        {health === 'expired' ? (
          <a
            href={
              isInstagram
                ? '/api/social/instagram/auth'
                : '/api/social/tiktok/auth'
            }
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-all bg-accent text-text-inverted hover:opacity-90"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Reconectar
          </a>
        ) : (
          <button
            onClick={() => onSync(account.id)}
            disabled={syncing}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-all bg-accent-surface text-accent hover:bg-accent-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={cn('w-3.5 h-3.5', syncing && 'animate-spin')}
            />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        )}
        <button
          onClick={() => onDisconnect(account.id)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-colors text-error hover:bg-error-surface"
          title="Desconectar"
        >
          <Unlink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
