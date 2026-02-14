'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { PostMetrics } from '@/types';

interface MetricsChartProps {
  metrics: PostMetrics[];
  loading: boolean;
}

interface ChartDataPoint {
  date: string;
  label: string;
  instagram: number;
  tiktok: number;
  total: number;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="card p-3 min-w-[160px]"
      style={{ boxShadow: 'var(--shadow-lg)' }}
    >
      <p className="text-xs font-medium text-text-secondary mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-text-secondary capitalize">{entry.name}</span>
          </div>
          <span className="text-xs font-semibold text-text-primary">
            {new Intl.NumberFormat('pt-BR').format(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function MetricsChart({ metrics, loading }: MetricsChartProps) {
  const chartData = useMemo(() => {
    if (!metrics.length) return [];

    // Group metrics by date
    const byDate = new Map<string, { instagram: number; tiktok: number }>();

    for (const m of metrics) {
      const date = m.publishedAt.split('T')[0];
      const existing = byDate.get(date) || { instagram: 0, tiktok: 0 };
      if (m.platform === 'instagram') {
        existing.instagram += m.views;
      } else {
        existing.tiktok += m.views;
      }
      byDate.set(date, existing);
    }

    // Sort by date and format
    const sorted = Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]): ChartDataPoint => ({
        date,
        label: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
        }),
        instagram: data.instagram,
        tiktok: data.tiktok,
        total: data.instagram + data.tiktok,
      }));

    return sorted;
  }, [metrics]);

  if (loading) {
    return (
      <div className="card p-5">
        <div className="skeleton h-4 w-32 mb-4" />
        <div className="skeleton h-[280px]" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="card p-8 flex flex-col items-center justify-center text-center">
        <p className="text-sm text-text-secondary">
          Sem dados de views para o periodo selecionado.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-text-primary mb-4">
        Views por dia
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="igGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E1306C" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#E1306C" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="tkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6E6E73" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6E6E73" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="instagram"
            name="Instagram"
            stroke="#E1306C"
            strokeWidth={2}
            fill="url(#igGradient)"
          />
          <Area
            type="monotone"
            dataKey="tiktok"
            name="TikTok"
            stroke="#6E6E73"
            strokeWidth={2}
            fill="url(#tkGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
