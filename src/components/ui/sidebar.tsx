'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Calendar,
  Lightbulb,
  BarChart3,
  Target,
  Share2,
  DollarSign,
  Settings,
  LogOut,
  Sparkles,
  Layers,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/ui/theme-toggle';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Menu',
    items: [
      { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={22} /> },
      { label: 'Calendário', href: '/calendar', icon: <Calendar size={22} /> },
      { label: 'Ideias', href: '/hooks', icon: <Lightbulb size={22} /> },
      { label: 'Ideação', href: '/ideation', icon: <Sparkles size={22} /> },
      { label: 'Métricas', href: '/metrics', icon: <BarChart3 size={22} /> },
      { label: 'Metas', href: '/goals', icon: <Target size={22} /> },
    ],
  },
  {
    title: 'Ferramentas',
    items: [
      { label: 'Séries', href: '/series', icon: <Layers size={22} /> },
      { label: 'Comissões', href: '/commissions', icon: <DollarSign size={22} /> },
      { label: 'Social', href: '/social', icon: <Share2 size={22} /> },
    ],
  },
  {
    title: 'Suporte',
    items: [
      { label: 'Configurações', href: '/settings/pillars', icon: <Settings size={22} /> },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="fixed z-40 flex flex-col left-[12px] top-[12px] w-[260px]"
      style={{
        height: 'calc(100vh - 24px)',
        borderRadius: '20px',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--bg-card)',
      }}
    >
      {/* Logo — no border-bottom */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center text-xs font-bold"
            style={{ backgroundColor: 'var(--accent)', color: '#fff', borderRadius: '12px' }}
          >
            CH
          </div>
          <span className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>
            Content Hub
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-4 py-2">
        <div className="flex flex-col gap-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              {/* Section Label — 13px medium, NOT uppercase, 0.02em */}
              <p
                className="mb-2 px-4 text-[13px] font-medium"
                style={{
                  color: 'var(--text-tertiary)',
                  letterSpacing: '0.02em',
                }}
              >
                {section.title}
              </p>

              {/* Section Items */}
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-2xl px-4 py-3 text-[16px] transition-all duration-150',
                        active ? 'font-semibold' : 'font-medium'
                      )}
                      style={{
                        backgroundColor: active ? 'var(--accent-surface)' : 'transparent',
                        color: active ? 'var(--accent)' : 'var(--text-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                      }}
                    >
                      <span
                        className="transition-colors"
                        style={{ color: active ? 'var(--accent)' : 'var(--text-tertiary)' }}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer — border-top, ThemeToggle + Logout */}
      <div className="px-4 pb-4 pt-2 flex flex-col gap-1" style={{ borderTop: '1px solid var(--border)' }}>
        <ThemeToggle />
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[16px] font-medium transition-colors"
          style={{
            color: 'var(--error)',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--error-surface)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <LogOut size={22} />
          Sair
        </button>
      </div>
    </aside>
  );
}
