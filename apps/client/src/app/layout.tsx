import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { I18nProvider } from '@/components/providers/i18n-provider';
import { getServerLang, getServerT } from '@/lib/i18n/server';
import { TarankaHeader } from '@/components/taranka/header';
import { AutoBreadcrumbs } from '@/components/taranka/auto-breadcrumbs';
import { CartWholesaleSync } from '@/components/taranka/cart-wholesale-sync';
import { mursGothic, montserrat, poppins } from './fonts';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT('common');
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

// Storefront reads live data in server components — render dynamically,
// don't prerender at build (which has no DATABASE_URL).
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getServerLang();
  return (
    <ClerkProvider>
      <html lang={lang} className={`${mursGothic.variable} ${montserrat.variable} ${poppins.variable}`}>
        <body className="min-h-screen bg-background font-taranka-body text-foreground antialiased">
          <I18nProvider lang={lang}>
            <NuqsAdapter>
              <CartWholesaleSync />
              <TarankaHeader />
              <AutoBreadcrumbs />
              <main>{children}</main>
            </NuqsAdapter>
          </I18nProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
