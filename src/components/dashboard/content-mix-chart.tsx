'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PillarMixItem {
  id: string;
  name: string;
  slug: string;
  color: string;
  targetPercentage: number;
  count: number;
  percentage: number;
}

interface ContentMixChartProps {
  data: PillarMixItem[];
  compact?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: PillarMixItem }>;
}

// Monochromatic palette: greens + warm accents
const DONUT_PALETTE = [
  '#A8D600', // CDR green
  '#8AB300', // darker green
  '#6E9000', // deep green
  '#FFD700', // gold accent
  '#FF6B4A', // coral accent
  '#C2F000', // lime green
  '#4A7A00', // forest green
  '#FBBF24', // amber accent
];

function getDonutColor(index: number): string {
  return DONUT_PALETTE[index % DONUT_PALETTE.length];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0].payload;

  return (
    <div
      style={{
        backgroundColor: '#1F2937',
        color: '#FFFFFF',
        borderRadius: '8px',
        padding: '8px 12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontSize: '12px',
        lineHeight: '1.4',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: item.color }}
        />
        <span style={{ fontWeight: 600 }}>{item.name}</span>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.7)' }}>
        {item.count} post{item.count !== 1 ? 's' : ''} ({item.percentage}%)
      </p>
      <p style={{ color: 'rgba(255,255,255,0.5)' }}>
        Alvo: {item.targetPercentage}%
      </p>
    </div>
  );
}

export default function ContentMixChart({ data, compact = false }: ContentMixChartProps) {
  const chartData = data.filter((item) => item.count > 0);
  const totalPosts = data.reduce((sum, d) => sum + d.count, 0);

  // Find biggest negative deviation for recommendation
  const deviations = data.map((item) => ({
    ...item,
    deviation: item.percentage - item.targetPercentage,
  }));

  const hasWarning = deviations.some((d) => Math.abs(d.deviation) > 15);
  const biggestNegative = deviations
    .filter((d) => d.deviation < 0)
    .sort((a, b) => a.deviation - b.deviation)[0];

  if (compact) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-full h-[140px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.length > 0 ? chartData : [{ name: 'Vazio', count: 1, color: 'var(--border)' }]}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="85%"
                dataKey="count"
                nameKey="name"
                stroke="var(--bg-card)"
                strokeWidth={3}
                paddingAngle={2}
                cornerRadius={4}
              >
                {(chartData.length > 0 ? chartData : [{ color: 'var(--border)' }]).map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartData.length > 0 ? getDonutColor(index) : 'var(--border)'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center number */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-text-primary">{totalPosts}</span>
          </div>
        </div>
        {/* Compact legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
          {data.map((item, index) => (
            <div key={item.id} className="flex items-center gap-1">
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: getDonutColor(index) }}
              />
              <span className="text-[10px] text-text-secondary">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full version with legend table
  return (
    <div>
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Chart */}
        <div className="w-full lg:w-1/2 h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.length > 0 ? chartData : [{ name: 'Vazio', count: 1, color: 'var(--border)' }]}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="85%"
                dataKey="count"
                nameKey="name"
                stroke="var(--bg-card)"
                strokeWidth={3}
                paddingAngle={2}
                cornerRadius={4}
              >
                {(chartData.length > 0 ? chartData : [{ color: 'var(--border)' }]).map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartData.length > 0 ? getDonutColor(index) : 'var(--border)'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="w-full lg:w-1/2">
          <div className="space-y-2">
            {deviations.map((item, index) => {
              const isOver = item.deviation > 0;
              const isWarning = Math.abs(item.deviation) > 15;

              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 py-1.5 px-2 rounded-lg',
                    isWarning && 'bg-warning-surface'
                  )}
                >
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: getDonutColor(index) }}
                  />
                  <span className="text-xs font-medium text-text-primary flex-1 min-w-0 truncate">
                    {item.name}
                  </span>
                  <span className="text-[11px] text-text-secondary tabular-nums w-8 text-right">
                    {item.percentage}%
                  </span>
                  <span className="text-[11px] text-text-tertiary tabular-nums w-8 text-right">
                    {item.targetPercentage}%
                  </span>
                  <span
                    className={cn(
                      'flex items-center gap-0.5 text-[11px] font-semibold tabular-nums w-12 justify-end',
                      item.deviation === 0 && 'text-text-tertiary',
                      item.deviation > 0 && 'text-success',
                      item.deviation < 0 && 'text-error'
                    )}
                  >
                    {item.deviation !== 0 && (
                      isOver
                        ? <ArrowUp size={10} />
                        : <ArrowDown size={10} />
                    )}
                    {item.deviation > 0 ? '+' : ''}{item.deviation}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Warning and Recommendation */}
      {hasWarning && biggestNegative && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-warning-surface px-4 py-3">
          <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">Recomendação:</span>{' '}
            Voce precisa de mais <span className="font-semibold" style={{ color: getDonutColor(data.indexOf(biggestNegative)) }}>{biggestNegative.name}</span> esta semana
            (desvio de {Math.abs(biggestNegative.deviation)}% abaixo do alvo).
          </p>
        </div>
      )}
    </div>
  );
}
