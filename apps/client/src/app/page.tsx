import Link from 'next/link';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/product/product-card';
import { CategoryDropdown } from '@/components/navigation/category-dropdown';

async function getFeaturedProducts() {
  try {
    const result = await api.products.getAll({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' });
    return result.data || [];
  } catch {
    return [];
  }
}

async function getCategories() {
  try {
    const result = await api.categories.getAll();
    const categories = result.data || [];
    return categories.filter((c: { depth: number }) => c.depth === 0).slice(0, 6);
  } catch {
    return [];
  }
}

const features = [
  {
    title: 'Free Shipping',
    description: 'On orders over $50',
  },
  {
    title: 'Easy Returns',
    description: '30-day return policy',
  },
  {
    title: 'Secure Payments',
    description: 'Encrypted & protected',
  },
  {
    title: 'Premium Quality',
    description: 'Curated collections',
  },
];

export default async function HomePage() {
  const [products, categories] = await Promise.all([getFeaturedProducts(), getCategories()]);

  return (
    <div>
      {/* Hero Section — dark gradient */}
      <section data-tour="hero" className="relative overflow-hidden bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-700">
        <div className="mx-auto max-w-container px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium tracking-[0.3em] text-neutral-400 uppercase">
              New Collection 2026
            </p>
            <h1 className="mt-6 text-display-lg font-light tracking-tight text-white sm:text-display-xl">
              Refined Essentials
            </h1>
            <p className="mt-4 text-lg font-light text-neutral-300">
              Curated pieces for the modern lifestyle. Timeless design meets premium quality.
            </p>

            {/* Category dropdown + CTA */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-4">
              {categories.length > 0 && (
                <CategoryDropdown categories={categories} />
              )}
              <Link
                href="/products"
                className="inline-flex items-center justify-center border border-white px-8 py-3.5 text-xs font-medium tracking-[0.2em] text-white uppercase transition hover:bg-white hover:text-neutral-900"
              >
                Shop All
              </Link>
              <Link
                href="/products?sort=createdAt:desc"
                className="inline-flex items-center justify-center px-8 py-3.5 text-xs font-medium tracking-[0.2em] text-neutral-400 uppercase transition hover:text-white"
              >
                New Arrivals
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative line */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </section>

      {/* Features strip */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-container px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="flex flex-col items-center text-center">
                <h3 className="text-xs font-semibold tracking-wider text-neutral-900 uppercase">{feature.title}</h3>
                <p className="mt-1 text-xs text-neutral-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-container px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="text-center">
            <h2 className="text-xs font-semibold tracking-[0.3em] text-neutral-400 uppercase">Categories</h2>
            <p className="mt-2 text-display-xs font-light text-neutral-900">Shop by Category</p>
          </div>
          <div data-tour="categories-grid" className="mt-10 grid grid-cols-2 gap-px bg-neutral-200 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category: { id: string; name: string; slug: string; description?: string | null }) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group flex flex-col items-center bg-white p-8 text-center transition hover:bg-neutral-50"
              >
                <h3 className="text-xs font-semibold tracking-wider text-neutral-900 uppercase transition group-hover:text-neutral-600">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-neutral-500">{category.description}</p>
                )}
                <span className="mt-3 text-xs text-neutral-400 transition group-hover:text-neutral-900">
                  Explore &rarr;
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {products.length > 0 && (
        <section data-tour="new-arrivals" className="border-t border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-container px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold tracking-[0.3em] text-neutral-400 uppercase">Latest</p>
                <h2 className="mt-2 text-display-xs font-light text-neutral-900">New Arrivals</h2>
              </div>
              <Link
                href="/products?sort=createdAt:desc"
                className="hidden text-xs font-medium tracking-wider text-neutral-900 uppercase transition hover:text-neutral-600 sm:block"
              >
                View all &rarr;
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-px bg-neutral-200 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.slice(0, 8).map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/products?sort=createdAt:desc"
                className="text-xs font-medium tracking-wider text-neutral-900 uppercase"
              >
                View all products &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Promo Banner */}
      <section className="mx-auto max-w-container px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden bg-neutral-900 px-6 py-20 text-center sm:px-16 sm:py-24">
          <div className="relative z-10">
            <p className="text-xs font-medium tracking-[0.3em] text-neutral-400 uppercase">Limited Time</p>
            <h2 className="mt-4 text-display-sm font-light text-white">
              Season Sale — Up to 40% Off
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-neutral-400">
              Don&apos;t miss out on our biggest sale of the season. Selected items across all categories.
            </p>
            <Link
              href="/products?onSale=true"
              className="mt-8 inline-flex items-center justify-center border border-white px-8 py-3 text-xs font-medium tracking-[0.2em] text-white uppercase transition hover:bg-white hover:text-neutral-900"
            >
              Shop the Sale
            </Link>
          </div>
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-transparent to-neutral-800 opacity-50" />
        </div>
      </section>

      {/* Newsletter */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-container px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-xs font-semibold tracking-[0.3em] text-neutral-400 uppercase">Newsletter</p>
            <h2 className="mt-2 text-display-xs font-light text-neutral-900">Stay Connected</h2>
            <p className="mt-3 text-sm text-neutral-500">
              Subscribe for exclusive offers, new arrivals, and curated content.
            </p>
            <form className="mt-6 flex gap-0" action="#">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-neutral-900 px-6 py-3 text-xs font-medium tracking-wider text-white uppercase transition hover:bg-neutral-800"
              >
                Subscribe
              </button>
            </form>
            <p className="mt-3 text-xs text-neutral-400">
              We respect your privacy. Read our{' '}
              <a href="/privacy" className="underline underline-offset-2 hover:text-neutral-600">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
