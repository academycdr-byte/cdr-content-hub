'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Calendar,
  Kanban,
  Lightbulb,
  MoreHorizontal,
  BarChart3,
  Target,
  Trophy,
  Share2,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const MAIN_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: <LayoutDashboard size={20} /> },
  { label: 'Calendario', href: '/calendar', icon: <Calendar size={20} /> },
  { label: 'Pipeline', href: '/pipeline', icon: <Kanban size={20} /> },
  { label: 'Ideias', href: '/hooks', icon: <Lightbulb size={20} /> },
];

const MORE_ITEMS: NavItem[] = [
  { label: 'Metricas', href: '/metrics', icon: <BarChart3 size={20} /> },
  { label: 'Metas', href: '/goals', icon: <Target size={20} /> },
  { label: 'Resultados', href: '/results', icon: <Trophy size={20} /> },
  { label: 'Social', href: '/social', icon: <Share2 size={20} /> },
  { label: 'Configuracoes', href: '/settings/pillars', icon: <Settings size={20} /> },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const isMoreActive = MORE_ITEMS.some((item) => isActive(item.href));

  return (
    <>
      {/* More dropdown */}
      {showMore && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 animate-backdrop"
            onClick={() => setShowMore(false)}
          />
          <div
            className="fixed bottom-16 right-2 z-50 w-48 rounded-xl bg-bg-card border border-border-default animate-slide-up"
            style={{ boxShadow: 'var(--shadow-lg)' }}
          >
            {MORE_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowMore(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors first:rounded-t-xl last:rounded-b-xl',
                  isActive(item.href)
                    ? 'bg-accent-surface text-accent'
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-bg-card border-border-default px-1 py-1"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 4px)' }}
      >
        {MAIN_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-[56px] transition-colors',
              isActive(item.href)
                ? 'text-accent'
                : 'text-text-tertiary'
            )}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
            {isActive(item.href) && (
              <div
                className="h-1 w-1 rounded-full"
                style={{ backgroundColor: '#B8FF00' }}
              />
            )}
          </Link>
        ))}

        {/* More button */}
        <button
          onClick={() => setShowMore(!showMore)}
          className={cn(
            'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-[56px] transition-colors',
            showMore || isMoreActive
              ? 'text-accent'
              : 'text-text-tertiary'
          )}
        >
          {showMore ? <X size={20} /> : <MoreHorizontal size={20} />}
          <span className="text-[10px] font-medium">Mais</span>
          {isMoreActive && !showMore && (
            <div
              className="h-1 w-1 rounded-full"
              style={{ backgroundColor: '#B8FF00' }}
            />
          )}
        </button>
      </nav>
    </>
  );
}
