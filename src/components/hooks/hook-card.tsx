import { memo } from 'react';
import { Copy, Hash } from 'lucide-react';
import type { Hook, PostFormat } from '@/types';
import { FORMAT_LABELS } from '@/types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from './constants';

interface HookCardProps {
  hook: Hook;
  index: number;
  pillarColor: string;
  pillarName: string;
  onCopy: (hook: Hook) => void;
  onClick: () => void;
}

export const HookCard = memo(function HookCard({ hook, index, pillarColor, pillarName, onCopy, onClick }: HookCardProps) {
  const catColors = CATEGORY_COLORS[hook.category] || { bg: 'rgba(142, 142, 147, 0.12)', text: '#8E8E93' };

  return (
    <div
      className="card card-hover p-4 flex items-start gap-4 animate-fade-in cursor-pointer"
      style={{ borderLeft: `3px solid ${pillarColor}` }}
      onClick={onClick}
    >
      {/* Number badge */}
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0"
        style={{ backgroundColor: catColors.bg, color: catColors.text }}
      >
        #{index}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary leading-relaxed line-clamp-2">
          {hook.text}
        </p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span
            className="badge text-[11px]"
            style={{
              backgroundColor: `${pillarColor}15`,
              color: pillarColor,
            }}
          >
            {pillarName}
          </span>
          <span className="badge bg-bg-secondary text-text-secondary text-[11px]">
            {FORMAT_LABELS[hook.format as PostFormat] || hook.format}
          </span>
          <span
            className="badge text-[11px]"
            style={{ backgroundColor: catColors.bg, color: catColors.text }}
          >
            {CATEGORY_LABELS[hook.category] || hook.category}
          </span>
          {hook.performanceScore > 0 && (
            <span
              className="badge text-[11px]"
              style={{
                backgroundColor: 'rgba(184, 255, 0, 0.12)',
                color: '#B8FF00',
              }}
            >
              Score {hook.performanceScore}
            </span>
          )}
          {hook.usageCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-text-tertiary">
              <Hash size={10} />
              {hook.usageCount}x
            </span>
          )}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onCopy(hook);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-colors shrink-0"
        title="Copiar"
      >
        <Copy size={15} />
      </button>
    </div>
  );
});
