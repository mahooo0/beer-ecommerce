import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { TarankaHeader } from '@/components/taranka/header';
import { AutoBreadcrumbs } from '@/components/taranka/auto-breadcrumbs';
import { mursGothic, montserrat, poppins } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Taranka — Sklep internetowy',
  description: 'Polsko-ukraiński sklep internetowy: piwo, ryba, snacks, słodycze.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="pl" className={`${mursGothic.variable} ${montserrat.variable} ${poppins.variable}`}>
        <body className="min-h-screen bg-background font-taranka-body text-foreground antialiased">
          <NuqsAdapter>
            <TarankaHeader />
            <AutoBreadcrumbs />
            <main>{children}</main>
          </NuqsAdapter>
        </body>
      </html>
    </ClerkProvider>
  );
}
