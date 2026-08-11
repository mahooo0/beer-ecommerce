'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FilterContentProps } from './filter-content';
import { FilterContent } from './filter-content';
import { ActiveFilters } from './active-filters';

type FilterSidebarProps = FilterContentProps;

export function FilterSidebar({ categoryAttributes, facetCounts }: FilterSidebarProps) {
  const { t } = useTranslation('categories');
  return (
    <aside
      className="hidden w-64 shrink-0 lg:block"
      data-testid="filter-sidebar"
    >
      <div className="sticky top-20">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold tracking-[0.2em] text-neutral-900 uppercase">{t('filters.title')}</h2>
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
