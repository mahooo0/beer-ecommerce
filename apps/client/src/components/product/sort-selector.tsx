'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface SortOption {
  label: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const sortOptions: SortOption[] = [
  { label: 'Newest', sortBy: 'createdAt', sortOrder: 'desc' },
  { label: 'Price: Low to High', sortBy: 'price', sortOrder: 'asc' },
  { label: 'Price: High to Low', sortBy: 'price', sortOrder: 'desc' },
  { label: 'Name: A-Z', sortBy: 'name', sortOrder: 'asc' },
  { label: 'Name: Z-A', sortBy: 'name', sortOrder: 'desc' },
];

interface SortSelectorProps {
  currentSort?: string;
  currentOrder?: string;
}

export function SortSelector({ currentSort = 'createdAt', currentOrder = 'desc' }: SortSelectorProps) {
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
        Sort
      </label>
      <select
        id="sort"
        value={currentValue}
        onChange={handleSortChange}
        className="border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
      >
        {sortOptions.map((option) => (
          <option key={`${option.sortBy}-${option.sortOrder}`} value={`${option.sortBy}-${option.sortOrder}`}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
