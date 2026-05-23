'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const MEILISEARCH_HOST = process.env.NEXT_PUBLIC_MEILISEARCH_HOST || 'http://localhost:7700';

interface ProductResult {
  id: string;
  name: string;
  price: number;
  images: string[];
  slug: string;
  brandName?: string | null;
  brand?: { name: string } | null;
  categoryName?: string | null;
  categoryId?: string | null;
  category?: { name: string; slug: string; id?: string } | null;
}

interface CategoryResult {
  id: string;
  name: string;
  slug: string;
  depth: number;
  _count?: { products: number };
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [allProducts, setAllProducts] = useState<ProductResult[]>([]);
  const [categories, setCategories] = useState<CategoryResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeSearch();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') closeSearch();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const closeSearch = () => {
    setIsOpen(false);
    setQuery('');
    setAllProducts([]);
    setCategories([]);
    setSelectedCategory(null);
  };

  const openSearch = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Search products via Meilisearch then API fallback
  const searchProducts = useCallback(async (q: string): Promise<ProductResult[]> => {
    if (!q.trim()) return [];

    // Try Meilisearch first
    try {
      const meiliRes = await fetch(`${MEILISEARCH_HOST}/indexes/products/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, limit: 12 }),
      });
      if (meiliRes.ok) {
        const data = await meiliRes.json();
        return data.hits || [];
      }
    } catch {
      // Fall back to API
    }

    // Fallback: API search
    try {
      const res = await fetch(`${API_URL}/products?limit=12&status=ACTIVE&search=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        return data.data || [];
      }
    } catch {}

    return [];
  }, []);

  // Search categories
  const searchCategories = useCallback(async (q: string): Promise<CategoryResult[]> => {
    if (!q.trim()) return [];

    try {
      const res = await fetch(`${API_URL}/categories`);
      if (res.ok) {
        const data = await res.json();
        const all: CategoryResult[] = data.data || [];
        return all
          .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
          .slice(0, 6);
      }
    } catch {}

    return [];
  }, []);

  // Combined search on debounced query
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setAllProducts([]);
      setCategories([]);
      setSelectedCategory(null);
      return;
    }

    setIsLoading(true);

    Promise.all([
      searchProducts(debouncedQuery),
      searchCategories(debouncedQuery),
    ]).then(([prodResults, catResults]) => {
      setAllProducts(prodResults);
      setCategories(catResults);
      setSelectedCategory(null);
    }).finally(() => {
      setIsLoading(false);
    });
  }, [debouncedQuery, searchProducts, searchCategories]);

  // Filter products by selected category
  const displayedProducts = selectedCategory
    ? allProducts.filter((p) => {
        const catId = p.categoryId || p.category?.id;
        const catName = p.categoryName || (typeof p.category === 'object' ? p.category?.name : null);
        return catId === selectedCategory || catName === selectedCategory;
      })
    : allProducts;

  const handleCategoryClick = (cat: CategoryResult) => {
    if (selectedCategory === cat.id) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(cat.id);
    }
  };

  const handleProductClick = () => {
    closeSearch();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      closeSearch();
      router.push(`/products?search=${encodeURIComponent(query)}`);
    }
  };

  const handleViewAll = () => {
    closeSearch();
    const params = new URLSearchParams();
    params.set('search', query);
    if (selectedCategory) {
      const cat = categories.find(c => c.id === selectedCategory);
      if (cat) params.set('category', cat.slug);
    }
    router.push(`/products?${params.toString()}`);
  };

  const getBrandName = (p: ProductResult) =>
    p.brandName || (typeof p.brand === 'object' ? p.brand?.name : null);

  const getCategoryName = (p: ProductResult) =>
    p.categoryName || (typeof p.category === 'object' ? p.category?.name : null);

  const hasResults = allProducts.length > 0 || categories.length > 0;
  const hasQuery = query.trim().length > 0;

  return (
    <>
      {/* Search icon trigger */}
      <button
        onClick={openSearch}
        aria-label="Search"
        data-tour="search"
        className="flex items-center justify-center text-neutral-600 transition hover:text-neutral-900"
      >
        <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Full-screen search overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeSearch}
          />

          {/* Search panel — drops from top */}
          <div
            ref={containerRef}
            className="relative mx-auto w-full max-w-4xl animate-in slide-in-from-top duration-300"
          >
            <div className="bg-white shadow-2xl">
              {/* Search input */}
              <form onSubmit={handleSubmit} className="flex items-center gap-4 border-b border-neutral-200 px-6 py-5">
                <svg className="size-6 shrink-0 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products, categories, brands..."
                  className="flex-1 bg-transparent text-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                  autoComplete="off"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(''); setSelectedCategory(null); inputRef.current?.focus(); }}
                    className="text-neutral-400 transition hover:text-neutral-900"
                  >
                    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
                <kbd className="hidden select-none rounded border border-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-400 sm:inline-block">
                  ESC
                </kbd>
              </form>

              {/* Results area */}
              <div className="max-h-[75vh] overflow-y-auto overscroll-contain">
                {/* Loading */}
                {isLoading && (
                  <div className="flex items-center justify-center py-16">
                    <div className="size-5 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900" />
                    <span className="ml-3 text-xs tracking-wider text-neutral-500 uppercase">Searching...</span>
                  </div>
                )}

                {/* No results */}
                {!isLoading && hasQuery && !hasResults && (
                  <div className="py-20 text-center">
                    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-neutral-100">
                      <svg className="size-5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-neutral-900">No results for &ldquo;{query}&rdquo;</p>
                    <p className="mt-1 text-xs text-neutral-400">Try a different search term or check the spelling</p>
                  </div>
                )}

                {/* Results */}
                {!isLoading && hasResults && (
                  <div>
                    {/* Categories */}
                    {categories.length > 0 && (
                      <div className="border-b border-neutral-100 px-6 py-4">
                        <h3 className="mb-3 text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">
                          Categories
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {categories.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => handleCategoryClick(cat)}
                              className={`inline-flex items-center gap-1.5 border px-4 py-2 text-sm transition ${
                                selectedCategory === cat.id
                                  ? 'border-neutral-900 bg-neutral-900 text-white'
                                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900'
                              }`}
                            >
                              <svg className={`size-3.5 ${selectedCategory === cat.id ? 'text-neutral-400' : 'text-neutral-300'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              {cat.name}
                              {cat._count?.products != null && (
                                <span className={`text-[10px] ${selectedCategory === cat.id ? 'text-neutral-400' : 'text-neutral-300'}`}>
                                  {cat._count.products}
                                </span>
                              )}
                            </button>
                          ))}
                          {selectedCategory && (
                            <button
                              onClick={() => setSelectedCategory(null)}
                              className="inline-flex items-center gap-1 border border-dashed border-neutral-300 px-3 py-2 text-xs text-neutral-400 transition hover:border-neutral-400 hover:text-neutral-600"
                            >
                              <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Clear filter
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Products */}
                    {displayedProducts.length > 0 && (
                      <div className="px-6 py-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">
                            Products
                            {selectedCategory && (
                              <span className="ml-2 text-neutral-300">
                                ({displayedProducts.length})
                              </span>
                            )}
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 gap-px bg-neutral-100 sm:grid-cols-2">
                          {displayedProducts.slice(0, 8).map((product) => (
                            <Link
                              key={product.id}
                              href={`/products/${product.slug || product.id}`}
                              onClick={handleProductClick}
                              className="group flex items-center gap-4 bg-white p-3 transition hover:bg-neutral-50"
                            >
                              {product.images?.[0] ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="size-16 object-cover"
                                />
                              ) : (
                                <div className="flex size-16 items-center justify-center bg-neutral-100 text-neutral-300">
                                  <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                                  </svg>
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                {getBrandName(product) && (
                                  <p className="text-[10px] font-medium tracking-[0.15em] text-neutral-400 uppercase">
                                    {getBrandName(product)}
                                  </p>
                                )}
                                <p className="truncate text-sm font-medium text-neutral-900">
                                  {product.name}
                                </p>
                                <div className="mt-0.5 flex items-center gap-2">
                                  <span className="text-sm font-semibold text-neutral-900">
                                    ${(product.price / 100).toFixed(2)}
                                  </span>
                                  {getCategoryName(product) && (
                                    <span className="text-[10px] text-neutral-400">
                                      in {getCategoryName(product)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <svg className="size-4 shrink-0 text-neutral-200 transition group-hover:text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M8.25 4.5l7.5 7.5-7.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No products in selected category */}
                    {selectedCategory && displayedProducts.length === 0 && (
                      <div className="px-6 py-12 text-center">
                        <p className="text-sm text-neutral-500">No products in this category</p>
                        <button
                          onClick={() => setSelectedCategory(null)}
                          className="mt-2 text-xs text-neutral-400 underline transition hover:text-neutral-600"
                        >
                          Show all results
                        </button>
                      </div>
                    )}

                    {/* View all results */}
                    {(displayedProducts.length > 0 || allProducts.length > 0) && (
                      <div className="border-t border-neutral-100 px-6 py-4">
                        <button
                          onClick={handleViewAll}
                          className="flex w-full items-center justify-center gap-2 bg-neutral-900 py-3.5 text-xs font-medium tracking-[0.2em] text-white uppercase transition hover:bg-neutral-800"
                        >
                          View all results
                          {allProducts.length > 8 && (
                            <span className="font-normal text-neutral-400">
                              ({allProducts.length}+)
                            </span>
                          )}
                          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14m0 0l-7-7m7 7l-7 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty state — no query yet */}
                {!hasQuery && !isLoading && (
                  <div className="px-6 py-8">
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">
                      Popular searches
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {['New Arrivals', 'Sale', 'Best Sellers', 'Trending'].map((term) => (
                        <button
                          key={term}
                          onClick={() => setQuery(term)}
                          className="border border-neutral-200 px-4 py-2 text-sm text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
