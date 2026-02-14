'use client';

import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import ToastProvider from '@/components/ui/toast-provider';
import { useThemeStore } from '@/stores/theme-store';

function ThemeInitializer() {
  const initTheme = useThemeStore((s) => s.initTheme);
  useEffect(() => {
    initTheme();
  }, [initTheme]);
  return null;
}

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeInitializer />
      {children}
      <ToastProvider />
    </SessionProvider>
  );
}
