'use client';

import React from 'react';
import type { FilterContentProps } from './filter-content';
import { FilterContent } from './filter-content';
import { ActiveFilters } from './active-filters';

type FilterSidebarProps = FilterContentProps;

export function FilterSidebar({ categoryAttributes, facetCounts }: FilterSidebarProps) {
  return (
    <aside
      className="hidden w-64 shrink-0 lg:block"
      data-testid="filter-sidebar"
    >
      <div className="sticky top-20">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold tracking-[0.2em] text-neutral-900 uppercase">Filters</h2>
        </div>

        <div className="mb-4">
          <ActiveFilters />
        </div>

        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto pr-1">
          <FilterContent
            categoryAttributes={categoryAttributes}
            facetCounts={facetCounts}
          />
        </div>
      </div>
    </aside>
  );
}
