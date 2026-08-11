'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface FilterButtonProps {
  activeFilterCount: number;
  onClick?: () => void;
}

export function FilterButton({ activeFilterCount, onClick }: FilterButtonProps) {
  const { t } = useTranslation('categories');
  return (
    <button
      onClick={onClick}
      className="lg:hidden inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-secondary bg-primary border border-border-primary rounded-lg hover:bg-primary_hover focus:outline-none focus-visible:outline-2 focus-visible:outline-focus-ring transition-colors"
      data-testid="filter-button"
      aria-label={t('filters.open')}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
      {t('filters.title')}
      {activeFilterCount > 0 && (
        <span
          className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-fg-white bg-brand-solid rounded-full"
          data-testid="filter-count-badge"
        >
          {activeFilterCount}
        </span>
      )}
    </button>
  );
}
