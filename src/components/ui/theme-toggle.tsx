'use client';

import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/stores/theme-store';

export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-sidebar-text-active"
      aria-label={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
    >
      <span
        className="inline-flex transition-transform duration-300"
        style={{ transform: isDark ? 'rotate(0deg)' : 'rotate(360deg)' }}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </span>
      {isDark ? 'Modo Claro' : 'Modo Escuro'}
    </button>
  );
}
