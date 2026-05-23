'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  InstantSearch,
  SearchBox,
  Hits,
  RefinementList,
  Pagination,
  Stats,
  Configure,
} from 'react-instantsearch';
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';

const searchClient = instantMeiliSearch(
  process.env.NEXT_PUBLIC_MEILISEARCH_HOST || 'http://localhost:7700',
  process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY || ''
);

interface ProductHit {
  id: string;
  name: string;
  price: number;
  images: string[];
  brandName: string | null;
  categoryName: string;
  objectID: string;
  _highlightResult?: {
    name?: {
      value: string;
    };
  };
}

function ProductCard({ hit }: { hit: ProductHit }) {
  const formattedPrice = `$${(hit.price / 100).toFixed(2)}`;
  const highlightedName = hit._highlightResult?.name?.value || hit.name;

  return (
    <Link
      href={`/products/${hit.id}`}
      className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
    >
      {hit.images && hit.images.length > 0 ? (
        <img
          src={hit.images[0]}
          alt={hit.name}
          className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity"
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">
          No image
        </div>
      )}
      <div className="p-4">
        <h3
          className="text-sm font-medium text-gray-900 mb-1 line-clamp-2"
          dangerouslySetInnerHTML={{ __html: highlightedName }}
        />
        <p className="text-lg font-bold text-gray-900 mb-2">{formattedPrice}</p>
        {hit.brandName && (
          <p className="text-xs text-gray-600 mb-1">{hit.brandName}</p>
        )}
        <p className="text-xs text-gray-500">{hit.categoryName}</p>
      </div>
    </Link>
  );
}

export function SearchResultsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  return (
    <InstantSearch
      searchClient={searchClient}
      indexName="products"
      future={{ preserveSharedStateOnUnmount: true }}
      initialUiState={{
        products: {
          query: initialQuery,
        },
      }}
    >
      <Configure hitsPerPage={20} />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search box */}
        <div className="mb-6">
          <SearchBox
            placeholder="Search products..."
            classNames={{
              root: 'relative',
              form: 'relative',
              input:
                'w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none',
              submit: 'hidden',
              reset: 'absolute right-3 top-1/2 -translate-y-1/2',
              submitIcon: 'hidden',
              resetIcon: 'w-5 h-5 text-gray-400',
              loadingIcon: 'hidden',
            }}
          />
        </div>

        {/* Stats */}
        <div className="mb-6">
          <Stats
            classNames={{
              root: 'text-sm text-gray-600',
            }}
          />
        </div>

        {/* Two-column layout */}
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="space-y-8">
              {/* Brand filter */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Brand
                </h3>
                <RefinementList
                  attribute="brandName"
                  classNames={{
                    root: 'space-y-2',
                    list: 'space-y-2',
                    item: 'flex items-center',
                    label: 'flex items-center gap-2 text-sm text-gray-700 cursor-pointer',
                    checkbox:
                      'w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500',
                    count:
                      'ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full',
                  }}
                />
              </div>

              {/* Category filter */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Category
                </h3>
                <RefinementList
                  attribute="categoryName"
                  classNames={{
                    root: 'space-y-2',
                    list: 'space-y-2',
                    item: 'flex items-center',
                    label: 'flex items-center gap-2 text-sm text-gray-700 cursor-pointer',
                    checkbox:
                      'w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500',
                    count:
                      'ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full',
                  }}
                />
              </div>

              {/* Product Type filter */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Product Type
                </h3>
                <RefinementList
                  attribute="productType"
                  classNames={{
                    root: 'space-y-2',
                    list: 'space-y-2',
                    item: 'flex items-center',
                    label: 'flex items-center gap-2 text-sm text-gray-700 cursor-pointer',
                    checkbox:
                      'w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500',
                    count:
                      'ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full',
                  }}
                />
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            <Hits
              hitComponent={ProductCard}
              classNames={{
                root: 'mb-8',
                list: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
                item: '',
              }}
            />

            {/* Pagination */}
            <div className="flex justify-center">
              <Pagination
                classNames={{
                  root: 'flex gap-2',
                  list: 'flex gap-2',
                  item: '',
                  link: 'px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm',
                  selectedItem: 'bg-blue-600 text-white border-blue-600',
                  disabledItem: 'opacity-50 cursor-not-allowed',
                }}
              />
            </div>
          </main>
        </div>
      </div>
    </InstantSearch>
  );
}
