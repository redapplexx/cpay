import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CPay',
  description: 'Digital wallet and remittance platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 