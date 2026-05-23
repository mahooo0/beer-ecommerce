import React from 'react';

function ProductCardSkeleton() {
  return (
    <div className="bg-white animate-pulse">
      <div className="aspect-[3/4] bg-neutral-100" />
      <div className="p-4">
        <div className="h-3 bg-neutral-100 w-1/3 mb-2" />
        <div className="h-4 bg-neutral-100 w-3/4 mb-1" />
        <div className="h-4 bg-neutral-100 w-1/2 mb-3" />
        <div className="h-4 bg-neutral-100 w-20" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-container px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <div className="flex items-end justify-between">
          <div>
            <div className="h-3 bg-neutral-100 w-20 mb-2 animate-pulse" />
            <div className="h-8 bg-neutral-100 w-48 animate-pulse" />
          </div>
          <div className="h-10 bg-neutral-100 w-40 animate-pulse" />
        </div>
        <div className="mt-6 h-px bg-neutral-200" />
      </div>

      <div className="grid grid-cols-1 gap-px bg-neutral-200 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
