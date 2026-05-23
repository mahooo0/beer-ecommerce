import React from 'react';

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Above the fold: two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column: image skeleton */}
        <div>
          {/* Main image */}
          <div className="aspect-square bg-gray-200 animate-pulse rounded-lg w-full" />
          {/* Thumbnail row */}
          <div className="flex gap-2 mt-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-16 h-16 bg-gray-200 animate-pulse rounded-md flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Right column: product info skeleton */}
        <div className="flex flex-col gap-4">
          {/* Breadcrumb */}
          <div className="h-4 bg-gray-200 animate-pulse rounded w-32" />

          {/* Title lines */}
          <div className="space-y-2">
            <div className="h-7 bg-gray-200 animate-pulse rounded w-3/4" />
            <div className="h-7 bg-gray-200 animate-pulse rounded w-1/2" />
          </div>

          {/* Brand */}
          <div className="h-4 bg-gray-200 animate-pulse rounded w-24" />

          {/* Rating */}
          <div className="h-5 bg-gray-200 animate-pulse rounded w-40" />

          {/* Price */}
          <div className="h-8 bg-gray-200 animate-pulse rounded w-28" />

          {/* Variant selector placeholder */}
          <div className="h-10 bg-gray-200 animate-pulse rounded w-full" />

          {/* Stock status */}
          <div className="h-5 bg-gray-200 animate-pulse rounded w-24" />

          {/* Add to cart button */}
          <div className="h-12 bg-gray-200 animate-pulse rounded-lg w-full" />

          {/* SKU */}
          <div className="h-3 bg-gray-200 animate-pulse rounded w-20" />
        </div>
      </div>

      {/* Below the fold: specs skeleton */}
      <div className="mt-12 space-y-8">
        {/* Specs table rows */}
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 animate-pulse rounded w-40 mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <div className="h-9 bg-gray-200 animate-pulse rounded w-1/3" />
              <div className="h-9 bg-gray-200 animate-pulse rounded flex-1" />
            </div>
          ))}
        </div>

        {/* Reviews skeleton */}
        <div className="border-t border-gray-200 pt-8 space-y-4">
          <div className="h-6 bg-gray-200 animate-pulse rounded w-44" />
          <div className="flex gap-6">
            <div className="w-24 h-24 bg-gray-200 animate-pulse rounded" />
            <div className="flex-1 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 animate-pulse rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
