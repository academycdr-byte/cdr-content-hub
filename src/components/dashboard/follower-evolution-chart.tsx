'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface AccountInfo {
  id: string;
  username: string;
  displayName: string;
  platform: string;
  currentFollowers: number;
}

interface FollowerEvolutionData {
  accounts: AccountInfo[];
  series: Record<string, string | number>[];
}

const PROFILE_COLORS = ['#A8D600', '#E4405F', '#00F2EA', '#FF6B00', '#8B5CF6'];

function formatFollowerCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

interface FollowerEvolutionChartProps {
  days: number;
}

export default function FollowerEvolutionChart({ days }: FollowerEvolutionChartProps) {
  const [data, setData] = useState<FollowerEvolutionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics/follower-evolution?days=${days}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json() as FollowerEvolutionData;
      setData(result);
    } catch (error) {
      console.error('Failed to fetch follower evolution:', error instanceof Error ? error.message : 'Unknown');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="card p-6">
        <div className="skeleton h-5 w-52 mb-4" />
        <div className="skeleton h-[250px]" />
      </div>
    );
  }

  if (!data || data.accounts.length === 0 || data.series.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-accent" />
          <p className="text-label text-text-tertiary">Evolução de Seguidores</p>
        </div>
        <p className="text-sm text-text-tertiary text-center py-8">
          Registre snapshots na aba Metas para acompanhar a evolução
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Users size={16} className="text-accent" />
        <p className="text-label text-text-tertiary">Evolução de Seguidores</p>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          data={data.series}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: string) => {
              const parts = v.split('-');
              return `${parts[2]}/${parts[1]}`;
            }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatFollowerCount(v)}
            width={45}
          />
          <Tooltip
            contentStyle={{
              background: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              fontSize: 12,
              color: '#FFFFFF',
              padding: '8px 12px',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}
            labelFormatter={(v) => {
              const d = new Date(String(v));
              return d.toLocaleDateString('pt-BR');
            }}
            formatter={(value) => {
              return formatFollowerCount(Number(value));
            }}
          />
          <Legend
            formatter={(value: string) => {
              const acc = data.accounts.find((a) => a.id === value);
              return `@${acc?.username || value}`;
            }}
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
          {data.accounts.map((acc, index) => (
            <Line
              key={acc.id}
              type="monotone"
              dataKey={acc.id}
              name={acc.id}
              stroke={PROFILE_COLORS[index % PROFILE_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Current followers summary */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border-default flex-wrap">
        {data.accounts.map((acc, index) => (
          <div key={acc.id} className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: PROFILE_COLORS[index % PROFILE_COLORS.length] }}
            />
            <span className="text-xs text-text-secondary">
              @{acc.username}
            </span>
            <span className="text-xs font-semibold text-text-primary">
              {formatFollowerCount(acc.currentFollowers)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
