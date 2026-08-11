'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface SortOption {
  labelKey: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const sortOptions: SortOption[] = [
  { labelKey: 'sort.newest', sortBy: 'createdAt', sortOrder: 'desc' },
  { labelKey: 'sort.priceLowHigh', sortBy: 'price', sortOrder: 'asc' },
  { labelKey: 'sort.priceHighLow', sortBy: 'price', sortOrder: 'desc' },
  { labelKey: 'sort.nameAsc', sortBy: 'name', sortOrder: 'asc' },
  { labelKey: 'sort.nameDesc', sortBy: 'name', sortOrder: 'desc' },
];

interface SortSelectorProps {
  currentSort?: string;
  currentOrder?: string;
}

export function SortSelector({ currentSort = 'createdAt', currentOrder = 'desc' }: SortSelectorProps) {
  const { t } = useTranslation('shop');
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentValue = `${currentSort}-${currentOrder}`;

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const parts = e.target.value.split('-');
    const sortBy = parts[0] ?? 'createdAt';
    const sortOrder = parts[1] ?? 'desc';
    const params = new URLSearchParams(searchParams.toString());
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="sort" className="text-xs font-medium tracking-wider text-neutral-400 uppercase">
        {t('sort.label')}
      </label>
      <select
        id="sort"
        value={currentValue}
        onChange={handleSortChange}
        className="border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
      >
        {sortOptions.map((option) => (
          <option key={`${option.sortBy}-${option.sortOrder}`} value={`${option.sortBy}-${option.sortOrder}`}>
            {t(option.labelKey)}
          </option>
        ))}
      </select>
    </div>
  );
}
