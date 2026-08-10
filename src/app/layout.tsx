import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'PILAH.ki — Pemantauan Kepatuhan Pemilahan Sampah Rumah Tangga',
  description:
    'PWA pemantauan pemilahan sampah rumah tangga: pelaporan warga, pendataan RT, hingga dashboard intervensi DLH.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#15803d',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background min-h-screen font-sans antialiased bg-weave-pattern" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
