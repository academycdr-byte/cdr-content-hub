import { memo } from 'react';
import { Trash2, Clock, Trophy, AlertCircle } from 'lucide-react';
import { GOAL_STATUS_LABELS } from '@/types';
import type { GoalWithProgress } from '@/types';
import { formatFollowerCount, getPlatformColor, getPlatformLabel, getStatusColor } from './helpers';

interface GoalCardProps {
  goal: GoalWithProgress;
  onSelect: (accountId: string) => void;
  onDelete: (id: string) => void;
}

export const GoalCard = memo(function GoalCard({ goal, onSelect, onDelete }: GoalCardProps) {
  const account = goal.socialAccount;
  const statusColors = getStatusColor(goal.status);
  const platformColor = getPlatformColor(account?.platform || '');
  const diff = goal.targetValue - (account?.followersCount || goal.currentValue);

  return (
    <div
      className="card p-5 card-hover cursor-pointer group relative"
      onClick={() => account && onSelect(account.id)}
    >
      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(goal.id); }}
        className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error-surface"
        title="Remover meta"
        aria-label="Remover meta"
      >
        <Trash2 size={14} className="text-error" />
      </button>

      {/* Header: Avatar + Platform Badge */}
      <div className="flex items-center gap-3 mb-4">
        {account?.profilePictureUrl ? (
          <img
            src={account.profilePictureUrl}
            alt={account.displayName}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: platformColor }}
          >
            {(account?.displayName || '?')[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            @{account?.username || 'unknown'}
          </p>
          <div className="flex items-center gap-2">
            <span
              className="badge text-[10px] py-0 px-1.5"
              style={{ backgroundColor: `${platformColor}20`, color: platformColor }}
            >
              {getPlatformLabel(account?.platform || '')}
            </span>
            <span
              className="badge text-[10px] py-0 px-1.5"
              style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
            >
              {GOAL_STATUS_LABELS[goal.status as keyof typeof GOAL_STATUS_LABELS] || goal.status}
            </span>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-2xl font-bold text-text-primary">
          {formatFollowerCount(account?.followersCount || goal.currentValue)}
        </span>
        <span className="text-sm text-text-secondary">
          / {formatFollowerCount(goal.targetValue)} seguidores
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full rounded-full bg-bg-hover overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(goal.progress, 100)}%`,
            backgroundColor: goal.status === 'achieved'
              ? 'var(--success)'
              : goal.status === 'expired'
                ? 'var(--error)'
                : 'var(--accent)',
          }}
        />
      </div>

      {/* Footer: Progress % + Days Remaining */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">
          {goal.progress}% completo
          {diff > 0 && goal.status === 'active' && (
            <span className="text-text-tertiary ml-1">
              (faltam {formatFollowerCount(diff)})
            </span>
          )}
        </span>
        {goal.status === 'active' && (
          <span className="text-xs text-text-tertiary flex items-center gap-1">
            <Clock size={10} />
            {goal.daysRemaining}d restantes
          </span>
        )}
        {goal.status === 'achieved' && (
          <span className="text-xs text-success flex items-center gap-1">
            <Trophy size={10} />
            Meta atingida
          </span>
        )}
        {goal.status === 'expired' && (
          <span className="text-xs text-error flex items-center gap-1">
            <AlertCircle size={10} />
            Expirada
          </span>
        )}
      </div>
    </div>
  );
});
