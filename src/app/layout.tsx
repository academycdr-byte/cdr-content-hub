import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from '@/components/providers';
import AppShell from '@/components/app-shell';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'CDR Content Hub',
    template: '%s | CDR Content Hub',
  },
  description: 'Sistema de producao de conteudo Instagram da CDR Group',
  other: {
    'tiktok-developers-site-verification': 'xnQg1imhq1YuzGVCD9lq1pyIjM7K7PEo',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={inter.variable}>
      <body className={inter.className}>
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
