import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/ui/error-boundary';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { performanceMonitor } from '@/lib/performance';
import RedirectScript from '@/components/shared/RedirectScript';
import { QueryProvider } from '@/components/shared/QueryProvider';
import Image from 'next/image';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CPay Platform',
  description: 'One Wallet. Infinite Speed.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/CPayWallet_blue.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize performance monitoring
  if (typeof window !== 'undefined') {
    performanceMonitor.trackPageLoad();
  }

  return (
    <html lang="en">
      <body>
            {children}
      </body>
    </html>
  );
}
