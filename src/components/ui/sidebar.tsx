'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Calendar,
  Kanban,
  Lightbulb,
  BarChart3,
  DollarSign,
  Layers,
  Share2,
  Settings,
  LogOut,
  Search,
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

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={20} /> },
  { label: 'Calendario', href: '/calendar', icon: <Calendar size={20} /> },
  { label: 'Pipeline', href: '/pipeline', icon: <Kanban size={20} /> },
  { label: 'Hooks', href: '/hooks', icon: <Lightbulb size={20} /> },
  { label: 'Metricas', href: '/metrics', icon: <BarChart3 size={20} /> },
  { label: 'Comissoes', href: '/commissions', icon: <DollarSign size={20} /> },
  { label: 'Batch', href: '/batch', icon: <Layers size={20} /> },
  { label: 'Social', href: '/social', icon: <Share2 size={20} /> },
  { label: 'Configuracoes', href: '/settings/pillars', icon: <Settings size={20} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { open: openSearch } = useSearchStore();

  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col bg-sidebar-bg border-r border-sidebar-border">
      {/* Logo + Actions */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm"
            style={{ backgroundColor: '#B8FF00', color: '#1D1D1F' }}
          >
            CH
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-text-active">Content Hub</p>
            <p className="text-[11px] text-sidebar-text">CDR Group</p>
          </div>
        </div>
        <NotificationBell />
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <button
          onClick={openSearch}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-sidebar-text-active"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Search size={15} />
          <span className="flex-1 text-left">Buscar...</span>
          <kbd className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-sidebar-hover border border-sidebar-border">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150',
              isActive(item.href)
                ? 'bg-sidebar-hover text-sidebar-text-active'
                : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
            )}
          >
            <span className={cn(
              'transition-colors',
              isActive(item.href) ? 'text-sidebar-text-active' : 'text-sidebar-text'
            )}>
              {item.icon}
            </span>
            {item.label}
            {isActive(item.href) && (
              <span
                className="ml-auto h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: '#B8FF00' }}
              />
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        <ThemeToggle />
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-sidebar-text-active"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
