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

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0].payload;

  return (
    <div
      className="rounded-lg border border-border-default px-3 py-2 bg-bg-card"
      style={{ boxShadow: 'var(--shadow-md)' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        <span className="text-xs font-semibold text-text-primary">{item.name}</span>
      </div>
      <p className="text-[11px] text-text-secondary">
        {item.count} post{item.count !== 1 ? 's' : ''} ({item.percentage}%)
      </p>
      <p className="text-[11px] text-text-tertiary">
        Alvo: {item.targetPercentage}%
      </p>
    </div>
  );
}

export default function ContentMixChart({ data, compact = false }: ContentMixChartProps) {
  const chartData = data.filter((item) => item.count > 0);

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
        <div className="w-full h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.length > 0 ? chartData : [{ name: 'Vazio', count: 1, color: '#E5E5EA' }]}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                dataKey="count"
                nameKey="name"
                stroke="none"
              >
                {(chartData.length > 0 ? chartData : [{ color: '#E5E5EA' }]).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Compact legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
          {data.map((item) => (
            <div key={item.id} className="flex items-center gap-1">
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
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
                data={chartData.length > 0 ? chartData : [{ name: 'Vazio', count: 1, color: '#E5E5EA' }]}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="count"
                nameKey="name"
                stroke="none"
              >
                {(chartData.length > 0 ? chartData : [{ color: '#E5E5EA' }]).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="w-full lg:w-1/2">
          <div className="space-y-2">
            {deviations.map((item) => {
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
                    style={{ backgroundColor: item.color }}
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
            <span className="font-semibold text-text-primary">Recomendacao:</span>{' '}
            Voce precisa de mais <span className="font-semibold" style={{ color: biggestNegative.color }}>{biggestNegative.name}</span> esta semana
            (desvio de {Math.abs(biggestNegative.deviation)}% abaixo do alvo).
          </p>
        </div>
      )}
    </div>
  );
}
