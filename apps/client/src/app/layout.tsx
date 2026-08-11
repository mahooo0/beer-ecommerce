import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { ClerkProvider } from '@clerk/nextjs';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { I18nProvider } from '@/components/providers/i18n-provider';
import { getServerLang, getServerT } from '@/lib/i18n/server';
import { TarankaHeader } from '@/components/taranka/header';
import { AutoBreadcrumbs } from '@/components/taranka/auto-breadcrumbs';
import { CartWholesaleSync } from '@/components/taranka/cart-wholesale-sync';
import { SITE, organizationJsonLd, websiteJsonLd, jsonLdScript } from '@/lib/blog-seo';
import { mursGothic, montserrat, poppins } from './fonts';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT('common');
  return {
    metadataBase: new URL(SITE),
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

// Storefront reads live data in server components — render dynamically,
// don't prerender at build (which has no DATABASE_URL).
export const dynamic = 'force-dynamic';

/** Prefer the URL locale segment (/pl, /uk) for <html lang>; else the cookie lang. */
async function resolveHtmlLang(): Promise<string> {
  const h = await headers();
  const seg = (h.get('x-pathname') || '').split('/')[1];
  if (seg === 'pl' || seg === 'uk') return seg;
  return getServerLang();
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await resolveHtmlLang();
  const cookieLang = await getServerLang();
  return (
    <ClerkProvider>
      <html lang={lang} className={`${mursGothic.variable} ${montserrat.variable} ${poppins.variable}`}>
        <body className="min-h-screen bg-background font-taranka-body text-foreground antialiased">
          <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(organizationJsonLd())} />
          <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(websiteJsonLd())} />
          <I18nProvider lang={cookieLang}>
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
