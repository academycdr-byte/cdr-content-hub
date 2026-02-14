'use client';

import { useState } from 'react';
import { Eye, Heart, MessageCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarEntry } from '@/types';

interface CalendarSocialCardProps {
  entry: CalendarEntry;
  compact?: boolean;
}

export default function CalendarSocialCard({ entry, compact = false }: CalendarSocialCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isInstagram = entry.platform === 'instagram';

  const handleClick = () => {
    if (entry.postUrl) {
      window.open(entry.postUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return String(num);
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className={cn(
          'w-full flex items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[11px] font-medium transition-all',
          'hover:ring-1 hover:ring-border-strong',
          entry.postUrl && 'cursor-pointer'
        )}
        style={{
          backgroundColor: isInstagram ? 'rgba(221, 42, 123, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          borderLeft: `3px solid ${isInstagram ? '#DD2A7B' : '#000000'}`,
        }}
      >
        <PlatformBadge platform={entry.platform} size="sm" />
        <span className="truncate text-text-primary">{entry.title}</span>
      </button>
    );
  }

  return (
    <div
      className="relative group"
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      <button
        onClick={handleClick}
        className={cn(
          'w-full flex items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[11px] font-medium transition-all',
          'hover:ring-1 hover:ring-border-strong',
          entry.postUrl && 'cursor-pointer'
        )}
        style={{
          backgroundColor: isInstagram ? 'rgba(221, 42, 123, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          borderLeft: `3px solid ${isInstagram ? '#DD2A7B' : '#000000'}`,
        }}
      >
        {/* Thumbnail */}
        {entry.thumbnailUrl && (
          <div className="h-5 w-5 rounded-sm overflow-hidden flex-shrink-0">
            <img
              src={entry.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Platform Badge */}
        <PlatformBadge platform={entry.platform} size="sm" />

        {/* Title */}
        <span className="truncate text-text-primary flex-1 min-w-0">{entry.title}</span>

        {/* Mini metrics */}
        {entry.metrics && (
          <span className="flex items-center gap-0.5 text-text-tertiary flex-shrink-0">
            <Eye size={9} />
            <span className="text-[10px]">{formatNumber(entry.metrics.views)}</span>
          </span>
        )}
      </button>

      {/* Hover tooltip with details */}
      {showDetails && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-[var(--radius-lg)] bg-bg-elevated border border-border-default shadow-[var(--shadow-lg)] p-3 animate-scale-in">
          {/* Thumbnail large */}
          {entry.thumbnailUrl && (
            <div className="w-full h-28 rounded-[var(--radius-md)] overflow-hidden mb-2">
              <img
                src={entry.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Account info */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <PlatformBadge platform={entry.platform} size="md" />
            <span className="text-xs text-text-secondary">@{entry.accountName}</span>
          </div>

          {/* Caption preview */}
          <p className="text-xs text-text-primary line-clamp-3 mb-2">{entry.title}</p>

          {/* Metrics row */}
          {entry.metrics && (
            <div className="flex items-center gap-3 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {formatNumber(entry.metrics.views)}
              </span>
              <span className="flex items-center gap-1">
                <Heart size={12} />
                {formatNumber(entry.metrics.likes)}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle size={12} />
                {formatNumber(entry.metrics.comments)}
              </span>
            </div>
          )}

          {/* Open link */}
          {entry.postUrl && (
            <div className="mt-2 pt-2 border-t border-border-default">
              <span className="flex items-center gap-1 text-[11px] text-accent">
                <ExternalLink size={11} />
                Abrir no {isInstagram ? 'Instagram' : 'TikTok'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlatformBadge({ platform, size = 'sm' }: { platform?: string; size?: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 10 : 14;

  if (platform === 'instagram') {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full flex-shrink-0',
          size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'
        )}
        style={{
          background: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)',
        }}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="4" stroke="white" strokeWidth="1.5" fill="none" />
          <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="1.5" fill="none" />
          <circle cx="17.5" cy="6.5" r="1" fill="white" />
        </svg>
      </span>
    );
  }

  if (platform === 'tiktok') {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-black flex-shrink-0',
          size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'
        )}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.6 5.82A4.5 4.5 0 0113.5 2h-2.5v13.5a2.5 2.5 0 11-2-2.45V10.5a5 5 0 105 5V9a7 7 0 004.1 1.33V7.83A4.5 4.5 0 0116.6 5.82z" />
        </svg>
      </span>
    );
  }

  return null;
}
