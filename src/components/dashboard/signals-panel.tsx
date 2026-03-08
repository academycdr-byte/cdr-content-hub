'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Zap,
  Share2,
  MessageCircle,
  Layers,
  BarChart3,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Signal {
  type: 'sharing' | 'conversation' | 'pillar_gap' | 'format_strength' | 'consistency';
  severity: 'info' | 'warning' | 'alert';
  title: string;
  description: string;
  action: string;
  relatedPostId?: string;
}

const SEVERITY_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  info: {
    bg: 'bg-info-surface',
    border: 'border-info',
    icon: 'text-info',
  },
  warning: {
    bg: 'bg-warning-surface',
    border: 'border-warning',
    icon: 'text-warning',
  },
  alert: {
    bg: 'bg-error-surface',
    border: 'border-error',
    icon: 'text-error',
  },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  sharing: <Share2 size={16} />,
  conversation: <MessageCircle size={16} />,
  pillar_gap: <Layers size={16} />,
  format_strength: <BarChart3 size={16} />,
  consistency: <AlertTriangle size={16} />,
};

export default function SignalsPanel() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSignals = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/signals');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json() as Signal[];
      setSignals(data);
    } catch (error) {
      console.error('Failed to fetch signals:', error instanceof Error ? error.message : 'Unknown');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  if (loading) {
    return (
      <div className="card p-6 mb-6">
        <div className="skeleton h-5 w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="skeleton h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (signals.length === 0) {
    return null;
  }

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-surface">
          <Zap size={14} className="text-accent" />
        </div>
        <h2 className="text-heading-3 text-text-primary">Sinais</h2>
        <span className="text-[11px] text-text-tertiary ml-auto">Ultimos 30 dias</span>
      </div>

      <div className="space-y-2">
        {signals.map((signal, index) => {
          const styles = SEVERITY_STYLES[signal.severity];

          return (
            <div
              key={index}
              className={cn(
                'rounded-xl border-l-[3px] p-3 animate-fade-in',
                styles.bg,
                styles.border
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-3">
                <span className={cn('shrink-0 mt-0.5', styles.icon)}>
                  {TYPE_ICONS[signal.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{signal.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{signal.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {signal.relatedPostId ? (
                      <Link
                        href={`/posts/${signal.relatedPostId}`}
                        className="flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent-hover transition-colors"
                      >
                        {signal.action}
                        <ArrowRight size={10} />
                      </Link>
                    ) : (
                      <span className="text-[11px] font-medium text-accent">
                        {signal.action}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
