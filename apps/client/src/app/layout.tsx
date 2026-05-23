import type { Metadata } from 'next';
import { ClerkProvider, UserButton, SignInButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { Suspense } from 'react';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { MegaMenu } from '@/components/navigation/mega-menu';
import { SearchBar } from '@/components/search/search-bar';
import { WishlistHeaderBadge } from '@/components/wishlist/wishlist-header-badge';
import { CompareHeaderBadge } from '@/components/compare/compare-header-badge';
import { CartHeaderButton } from '@/components/cart/cart-header-button';
import { ChatWidget } from '@/components/ai-assistant/ChatWidget';
import { Footer } from '@/components/layout/footer';
import { TourProvider } from '@/components/guidance/tour-provider';
import { TourButton } from '@/components/guidance/tour-button';
import './globals.css';

export const metadata: Metadata = {
  title: 'STORE — Premium E-Commerce',
  description: 'Discover curated products with fast shipping and exceptional quality.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-primary text-primary antialiased">
          <NuqsAdapter>
            <TourProvider>
              {/* Promo banner */}
              <div data-tour="promo-banner" className="bg-brand-solid px-4 py-2 text-center text-xs font-medium tracking-widest text-white uppercase">
                Free shipping on all orders over $50 —{' '}
                <a href="/products" className="underline underline-offset-2">
                  Shop now
                </a>
              </div>

              {/* Header */}
              <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
                <nav className="mx-auto flex max-w-container items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                  {/* Logo */}
                  <a href="/" className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-[0.2em] text-neutral-900 uppercase">Store</span>
                  </a>

                  {/* Center: Mega Menu */}
                  <div className="hidden lg:block" data-tour="mega-menu">
                    <Suspense fallback={<div className="h-6" />}>
                      <MegaMenu />
                    </Suspense>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-4" data-tour="header-actions">
                    <div data-tour="search">
                      <SearchBar />
                    </div>
                    <CompareHeaderBadge />
                    <WishlistHeaderBadge />
                    <CartHeaderButton />
                    {userId ? (
                      <div className="flex items-center gap-3">
                        <a
                          href="/profile"
                          className="hidden text-xs font-medium tracking-wider text-neutral-600 uppercase transition hover:text-neutral-900 md:block"
                        >
                          Account
                        </a>
                        <UserButton />
                      </div>
                    ) : (
                      <SignInButton mode="redirect">
                        <button className="text-xs font-medium tracking-wider text-neutral-600 uppercase transition hover:text-neutral-900">
                          Sign In
                        </button>
                      </SignInButton>
                    )}
                  </div>
                </nav>

                {/* Mobile Mega Menu */}
                <div className="lg:hidden border-t border-neutral-100">
                  <Suspense fallback={<div className="h-10" />}>
                    <MegaMenu />
                  </Suspense>
                </div>
              </header>

              {/* Main content */}
              <main className="min-h-[calc(100vh-200px)]">{children}</main>

              {/* Footer */}
              <Footer />

              {/* Tour Button */}
              <TourButton />

              {/* Chat Widget */}
              <ChatWidget />
            </TourProvider>
          </NuqsAdapter>
        </body>
      </html>
    </ClerkProvider>
  );
}
