'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Flame,
  Zap,
  Trophy,
  Target,
  Star,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeatmapDay {
  date: string;
  count: number;
  level: number;
}

interface Badge {
  id: string;
  label: string;
  icon: string;
  earned: boolean;
  description: string;
}

interface ConsistencyData {
  currentStreak: number;
  longestStreak: number;
  weeklyScore: number;
  monthlyScore: number;
  totalPublished: number;
  heatmapData: HeatmapDay[];
  badges: Badge[];
}

const LEVEL_COLORS = [
  'bg-bg-hover',           // 0 - no posts
  'bg-accent-surface',     // 1 - 1 post (light)
  'bg-accent-muted',       // 2 - 2 posts (medium)
  'bg-accent',             // 3 - 3+ posts (dark)
] as const;


const BADGE_ICONS: Record<string, React.ReactNode> = {
  flame: <Flame size={16} />,
  zap: <Zap size={16} />,
  trophy: <Trophy size={16} />,
  target: <Target size={16} />,
  star: <Star size={16} />,
};

const WEEKDAY_LABELS = ['', 'Seg', '', 'Qua', '', 'Sex', ''] as const;

export default function ConsistencyHeatmap() {
  const [data, setData] = useState<ConsistencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/consistency');
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json() as ConsistencyData;
      setData(result);
    } catch (error) {
      console.error('Failed to fetch consistency:', error instanceof Error ? error.message : 'Unknown');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="card p-6 animate-fade-in">
        <div className="skeleton h-6 w-40 mb-4" />
        <div className="flex gap-4 mb-4">
          <div className="skeleton h-20 w-24" />
          <div className="skeleton h-20 w-24" />
          <div className="skeleton h-20 w-24" />
        </div>
        <div className="skeleton h-24 w-full" />
      </div>
    );
  }

  if (!data) return null;

  // Organize heatmap into weeks (columns of 7 days)
  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];

  // Pad the beginning if the first day isn't Sunday
  const firstDate = new Date(data.heatmapData[0]?.date || new Date());
  const startDow = firstDate.getDay();
  for (let i = 0; i < startDow; i++) {
    currentWeek.push({ date: '', count: -1, level: -1 });
  }

  for (const day of data.heatmapData) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return (
    <div className="card p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-heading-2 text-text-primary">Consistencia</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-text-tertiary">Menos</span>
            {[0, 1, 2, 3].map((level) => (
              <div
                key={level}
                className={cn(
                  'h-3 w-3 rounded-sm',
                  LEVEL_COLORS[level]
                )}
              />
            ))}
            <span className="text-[10px] text-text-tertiary">Mais</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl bg-bg-secondary p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Flame size={16} className="text-warning" />
            <span className="text-xl font-bold text-text-primary">{data.currentStreak}</span>
          </div>
          <p className="text-[11px] text-text-tertiary">Streak atual</p>
        </div>
        <div className="rounded-xl bg-bg-secondary p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <TrendingUp size={16} className="text-accent" />
            <span className="text-xl font-bold text-text-primary">{data.longestStreak}</span>
          </div>
          <p className="text-[11px] text-text-tertiary">Maior streak</p>
        </div>
        <div className="rounded-xl bg-bg-secondary p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Target size={16} className="text-info" />
            <span className="text-xl font-bold text-text-primary">{data.weeklyScore}%</span>
          </div>
          <p className="text-[11px] text-text-tertiary">Score semanal</p>
        </div>
        <div className="rounded-xl bg-bg-secondary p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Star size={16} className="text-accent" />
            <span className="text-xl font-bold text-text-primary">{data.monthlyScore}%</span>
          </div>
          <p className="text-[11px] text-text-tertiary">Score mensal</p>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="flex gap-0.5">
          {/* Weekday labels */}
          <div className="flex flex-col gap-0.5 pr-1 shrink-0">
            {WEEKDAY_LABELS.map((label, i) => (
              <div key={i} className="h-3 flex items-center">
                <span className="text-[9px] text-text-tertiary w-4">{label}</span>
              </div>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-0.5">
              {week.map((day, dayIdx) => (
                <div
                  key={`${weekIdx}-${dayIdx}`}
                  className={cn(
                    'h-3 w-3 rounded-sm transition-all cursor-default',
                    day.level === -1 ? 'opacity-0' : LEVEL_COLORS[day.level] || LEVEL_COLORS[0],
                    day.level > 0 && 'hover:ring-1 hover:ring-accent hover:ring-offset-1'
                  )}
                  onMouseEnter={() => day.level >= 0 ? setHoveredDay(day) : undefined}
                  onMouseLeave={() => setHoveredDay(null)}
                  title={day.date && day.level >= 0 ? `${day.date}: ${day.count} post${day.count !== 1 ? 's' : ''}` : undefined}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredDay && hoveredDay.level >= 0 && (
        <div className="mt-2 text-xs text-text-secondary">
          {hoveredDay.date}: {hoveredDay.count} post{hoveredDay.count !== 1 ? 's' : ''}
        </div>
      )}

      {/* Badges */}
      <div className="mt-6 pt-4 border-t border-border-default">
        <p className="text-label text-text-tertiary mb-3">Badges</p>
        <div className="flex flex-wrap gap-2">
          {data.badges.map((badge) => (
            <div
              key={badge.id}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 transition-all',
                badge.earned
                  ? 'border-accent bg-accent-surface'
                  : 'border-border-default bg-bg-secondary opacity-40'
              )}
              title={badge.description}
            >
              <span className={cn(
                badge.earned ? 'text-accent' : 'text-text-tertiary'
              )}>
                {BADGE_ICONS[badge.icon] || <Star size={16} />}
              </span>
              <span className={cn(
                'text-xs font-medium',
                badge.earned ? 'text-text-primary' : 'text-text-tertiary'
              )}>
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
