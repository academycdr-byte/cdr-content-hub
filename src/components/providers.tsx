'use client';

import { SessionProvider } from 'next-auth/react';
import ToastProvider from '@/components/ui/toast-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {children}
      <ToastProvider />
    </SessionProvider>
  );
}
