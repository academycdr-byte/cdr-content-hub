'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MONTH_NAMES } from '@/lib/utils';

// ===== Types =====

export type DatePreset = '7d' | '30d' | '90d' | 'this_month' | 'last_month' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
  preset: DatePreset;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

// ===== Preset Definitions =====

interface PresetOption {
  key: DatePreset;
  label: string;
}

const PRESETS: PresetOption[] = [
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: '90d', label: '90 dias' },
  { key: 'this_month', label: 'Este mes' },
  { key: 'last_month', label: 'Mes anterior' },
  { key: 'custom', label: 'Custom' },
];

// ===== Helpers =====

export function computeDateRange(preset: DatePreset): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (preset) {
    case '7d': {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end: today, preset };
    }
    case '30d': {
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      return { start, end: today, preset };
    }
    case '90d': {
      const start = new Date(today);
      start.setDate(today.getDate() - 89);
      start.setHours(0, 0, 0, 0);
      return { start, end: today, preset };
    }
    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return { start, end: today, preset };
    }
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end, preset };
    }
    case 'custom':
    default:
      return { start: today, end: today, preset: 'custom' };
  }
}

export function getDateRangeLabel(range: DateRange): string {
  const { preset, start, end } = range;

  switch (preset) {
    case '7d':
      return 'ultimos 7 dias';
    case '30d':
      return 'ultimos 30 dias';
    case '90d':
      return 'ultimos 90 dias';
    case 'this_month': {
      const monthName = MONTH_NAMES[start.getMonth()];
      return `em ${monthName}`;
    }
    case 'last_month': {
      const monthName = MONTH_NAMES[start.getMonth()];
      return `em ${monthName}`;
    }
    case 'custom': {
      const fmt = (d: Date) =>
        `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      return `${fmt(start)} - ${fmt(end)}`;
    }
    default:
      return '';
  }
}

function formatInputDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ===== Component =====

export default function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(value.preset === 'custom');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!showCustom) return;

    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowCustom(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCustom]);

  const handlePreset = useCallback(
    (preset: DatePreset) => {
      if (preset === 'custom') {
        setShowCustom(true);
        // Set custom with current range values but preset = custom
        onChange({ ...value, preset: 'custom' });
        return;
      }
      setShowCustom(false);
      const range = computeDateRange(preset);
      onChange(range);
    },
    [onChange, value]
  );

  const handleCustomStart = useCallback(
    (dateStr: string) => {
      const d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return;
      onChange({ start: d, end: value.end, preset: 'custom' });
    },
    [onChange, value.end]
  );

  const handleCustomEnd = useCallback(
    (dateStr: string) => {
      const d = new Date(dateStr + 'T23:59:59');
      if (isNaN(d.getTime())) return;
      onChange({ start: value.start, end: d, preset: 'custom' });
    },
    [onChange, value.start]
  );

  const customLabel = useMemo(() => {
    if (value.preset !== 'custom') return 'Custom';
    const fmt = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    return `${fmt(value.start)} - ${fmt(value.end)}`;
  }, [value]);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Segmented Control */}
      <div className="flex items-center gap-1 rounded-xl bg-bg-secondary p-1">
        {PRESETS.map((preset) => {
          const isActive =
            preset.key === value.preset ||
            (preset.key === 'custom' && value.preset === 'custom');

          // For custom button, show the date range label
          const label = preset.key === 'custom' && value.preset === 'custom'
            ? customLabel
            : preset.label;

          return (
            <button
              key={preset.key}
              onClick={() => handlePreset(preset.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                isActive
                  ? 'bg-accent text-text-inverted shadow-[var(--shadow-sm)]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              )}
            >
              {preset.key === 'custom' && (
                <Calendar size={12} className="inline mr-1 -mt-px" />
              )}
              {label}
            </button>
          );
        })}
      </div>

      {/* Custom Date Popover */}
      {showCustom && value.preset === 'custom' && (
        <div
          ref={popoverRef}
          className="card p-3 flex items-center gap-2 animate-fade-in"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          <input
            type="date"
            value={formatInputDate(value.start)}
            onChange={(e) => handleCustomStart(e.target.value)}
            className="input !py-1.5 !px-2 !text-xs w-[130px]"
            max={formatInputDate(value.end)}
          />
          <span className="text-xs text-text-tertiary">ate</span>
          <input
            type="date"
            value={formatInputDate(value.end)}
            onChange={(e) => handleCustomEnd(e.target.value)}
            className="input !py-1.5 !px-2 !text-xs w-[130px]"
            min={formatInputDate(value.start)}
          />
        </div>
      )}
    </div>
  );
}
