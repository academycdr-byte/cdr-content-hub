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
  Search,
  Sparkles,
  Layers,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/ui/theme-toggle';
import NotificationBell from '@/components/ui/notification-bell';
import { useSearchStore } from '@/stores/search-store';

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
      { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={20} /> },
      { label: 'Calendário', href: '/calendar', icon: <Calendar size={20} /> },
      { label: 'Ideias', href: '/hooks', icon: <Lightbulb size={20} /> },
      { label: 'Ideação', href: '/ideation', icon: <Sparkles size={20} /> },
      { label: 'Métricas', href: '/metrics', icon: <BarChart3 size={20} /> },
      { label: 'Metas', href: '/goals', icon: <Target size={20} /> },
    ],
  },
  {
    title: 'Ferramentas',
    items: [
      { label: 'Séries', href: '/series', icon: <Layers size={20} /> },
      { label: 'Comissões', href: '/commissions', icon: <DollarSign size={20} /> },
      { label: 'Social', href: '/social', icon: <Share2 size={20} /> },
    ],
  },
  {
    title: 'Suporte',
    items: [
      { label: 'Configurações', href: '/settings/pillars', icon: <Settings size={20} /> },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { open: openSearch } = useSearchStore();

  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col" style={{ backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}>
      {/* Logo + Notification */}
      <div className="flex h-16 items-center justify-between px-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          >
            CH
          </div>
          <span className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Content Hub
          </span>
        </div>
        <NotificationBell />
      </div>

      {/* Search */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={openSearch}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] transition-colors"
          style={{
            border: '1px solid var(--border)',
            color: 'var(--text-tertiary)',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <Search size={16} />
          <span className="flex-1 text-left">Buscar...</span>
          <kbd
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
            style={{
              backgroundColor: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              color: 'var(--text-tertiary)',
            }}
          >
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-4 py-2">
        <div className="flex flex-col gap-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              {/* Section Label */}
              <p
                className="mb-2 px-3 text-[12px] font-semibold uppercase"
                style={{
                  color: 'var(--text-tertiary)',
                  letterSpacing: '0.05em',
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
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-150'
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

      {/* Footer */}
      <div className="px-4 pb-4 pt-2 flex flex-col gap-1" style={{ borderTop: '1px solid var(--border)' }}>
        <ThemeToggle />
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors"
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
          <LogOut size={20} />
          Sair
        </button>
      </div>
    </aside>
  );
}
