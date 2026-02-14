'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '@/stores/theme-store';
import { cn } from '@/lib/utils';

type ThemeOption = 'light' | 'dark' | 'system';

interface ThemeCard {
  value: ThemeOption;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const THEME_OPTIONS: ThemeCard[] = [
  {
    value: 'light',
    label: 'Claro',
    description: 'Tema claro para uso diurno',
    icon: <Sun size={24} />,
  },
  {
    value: 'dark',
    label: 'Escuro',
    description: 'Tema escuro para reduzir cansaco visual',
    icon: <Moon size={24} />,
  },
  {
    value: 'system',
    label: 'Sistema',
    description: 'Segue a preferencia do seu dispositivo',
    icon: <Monitor size={24} />,
  },
];

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-heading-1 text-text-primary">Aparencia</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Personalize a aparencia do Content Hub.
        </p>
      </div>

      {/* Theme Selection */}
      <div className="space-y-3">
        <p className="text-label text-text-tertiary">Tema</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {THEME_OPTIONS.map((option) => {
            const isSelected = theme === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  'card p-5 text-left transition-all duration-200 cursor-pointer',
                  isSelected
                    ? 'border-accent ring-1 ring-accent'
                    : 'hover:border-border-strong'
                )}
              >
                <div
                  className={cn(
                    'mb-3 transition-colors',
                    isSelected ? 'text-accent' : 'text-text-secondary'
                  )}
                >
                  {option.icon}
                </div>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    isSelected ? 'text-text-primary' : 'text-text-secondary'
                  )}
                >
                  {option.label}
                </p>
                <p className="mt-1 text-xs text-text-tertiary">
                  {option.description}
                </p>
                {isSelected && (
                  <div
                    className="mt-3 h-1 w-8 rounded-full"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Navigation */}
      <div className="mt-8 pt-6 border-t border-border-default">
        <p className="text-label text-text-tertiary mb-3">Configuracoes</p>
        <div className="flex gap-3">
          <a
            href="/settings/pillars"
            className="badge bg-bg-secondary text-text-secondary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            Pilares de Conteudo
          </a>
          <a
            href="/settings/checklists"
            className="badge bg-bg-secondary text-text-secondary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            Checklists
          </a>
          <span className="badge bg-accent-surface text-accent">
            Aparencia
          </span>
        </div>
      </div>
    </div>
  );
}
