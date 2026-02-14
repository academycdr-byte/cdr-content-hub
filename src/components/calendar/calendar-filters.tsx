'use client';

import { cn } from '@/lib/utils';
import type { SocialPlatform } from '@/types';

interface FilterAccount {
  id: string;
  platform: SocialPlatform;
  username: string;
  displayName: string;
}

interface CalendarFiltersProps {
  selectedPlatform: SocialPlatform | null;
  selectedAccountId: string | null;
  accounts: FilterAccount[];
  onPlatformChange: (platform: SocialPlatform | null) => void;
  onAccountChange: (accountId: string | null) => void;
}

const PLATFORM_OPTIONS: Array<{ value: SocialPlatform | null; label: string }> = [
  { value: null, label: 'Todos' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
];

export default function CalendarFilters({
  selectedPlatform,
  selectedAccountId,
  accounts,
  onPlatformChange,
  onAccountChange,
}: CalendarFiltersProps) {
  // Filter accounts by selected platform
  const filteredAccounts = selectedPlatform
    ? accounts.filter((a) => a.platform === selectedPlatform)
    : accounts;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Platform Segmented Control */}
      <div className="flex items-center rounded-[var(--radius-lg)] border border-border-default bg-bg-card p-1 gap-0.5">
        {PLATFORM_OPTIONS.map((option) => (
          <button
            key={option.value ?? 'all'}
            onClick={() => {
              onPlatformChange(option.value);
              onAccountChange(null);
            }}
            className={cn(
              'flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-medium transition-all',
              selectedPlatform === option.value
                ? 'bg-bg-elevated text-text-primary shadow-[var(--shadow-sm)]'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {option.value && (
              <PlatformIcon platform={option.value} size={14} />
            )}
            {option.label}
          </button>
        ))}
      </div>

      {/* Account Dropdown */}
      {filteredAccounts.length > 0 && (
        <div className="relative">
          <select
            value={selectedAccountId || ''}
            onChange={(e) => onAccountChange(e.target.value || null)}
            className="input py-1.5 pl-3 pr-8 text-sm appearance-none cursor-pointer min-w-[180px]"
          >
            <option value="">Todos os perfis</option>
            {filteredAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.platform === 'instagram' ? 'IG' : 'TT'} @{account.username}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary" />
        </div>
      )}

      {/* Active filter indicator */}
      {(selectedPlatform || selectedAccountId) && (
        <button
          onClick={() => {
            onPlatformChange(null);
            onAccountChange(null);
          }}
          className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}

function PlatformIcon({ platform, size = 16 }: { platform: SocialPlatform; size?: number }) {
  if (platform === 'instagram') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#ig-grad)" strokeWidth="2" />
        <circle cx="12" cy="12" r="5" stroke="url(#ig-grad)" strokeWidth="2" />
        <circle cx="18" cy="6" r="1.5" fill="url(#ig-grad)" />
        <defs>
          <linearGradient id="ig-grad" x1="2" y1="22" x2="22" y2="2">
            <stop stopColor="#F58529" />
            <stop offset="0.5" stopColor="#DD2A7B" />
            <stop offset="1" stopColor="#8134AF" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .56.04.82.12v-3.49a6.37 6.37 0 00-.82-.05A6.34 6.34 0 003.15 15.3a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.37a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.8z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
