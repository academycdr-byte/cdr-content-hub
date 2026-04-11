'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Lightbulb,
  BarChart3,
  Target,
  Share2,
  DollarSign,
  LogOut,
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
      { label: 'Ideias', href: '/hooks', icon: <Lightbulb size={22} /> },
      { label: 'Métricas', href: '/metrics', icon: <BarChart3 size={22} /> },
      { label: 'Metas', href: '/goals', icon: <Target size={22} /> },
    ],
  },
  {
    title: 'Ferramentas',
    items: [
      { label: 'Comissões', href: '/commissions', icon: <DollarSign size={22} /> },
      { label: 'Social', href: '/social', icon: <Share2 size={22} /> },
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
    <aside className="w-[240px] shrink-0 flex flex-col h-full">
      <nav className="flex-1 overflow-y-auto px-4 py-2">
        <div className="flex flex-col gap-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p
                className="mb-2 px-4 text-[13px] font-medium"
                style={{ color: 'var(--text-tertiary)', letterSpacing: '0.02em' }}
              >
                {section.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-2xl px-4 py-2.5 text-[14px] transition-all duration-150',
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

      <div className="px-4 pb-4 pt-3 flex flex-col gap-1" style={{ borderTop: '1px solid var(--border)' }}>
        <ThemeToggle />
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-[14px] font-medium transition-colors"
          style={{ color: 'var(--error)', backgroundColor: 'transparent' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--error-surface)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <LogOut size={22} />
          Sair
        </button>
      </div>
    </aside>
  );
}
