'use client';

import { DataTableFilters, type FilterConfig } from '@/components/DataTableFilters';
import { useFilterParams } from '@/hooks/use-filter-params';

interface ProductsFiltersProps {
  initialValues: Record<string, string>;
  categoryOptions: { value: string; label: string }[];
}

const filterConfigs: FilterConfig[] = [
  { key: 'search', label: 'Search', type: 'search', placeholder: 'Search products...' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    placeholder: 'All Statuses',
    options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'DRAFT', label: 'Draft' },
      { value: 'ARCHIVED', label: 'Archived' },
    ],
  },
  {
    key: 'productType',
    label: 'Type',
    type: 'select',
    placeholder: 'All Types',
    options: [
      { value: 'SIMPLE', label: 'Simple' },
      { value: 'VARIABLE', label: 'Variable' },
      { value: 'WEIGHTED', label: 'Weighted' },
      { value: 'DIGITAL', label: 'Digital' },
      { value: 'BUNDLED', label: 'Bundled' },
    ],
  },
  {
    key: 'sortBy',
    label: 'Sort By',
    type: 'select',
    placeholder: 'Default',
    options: [
      { value: 'createdAt', label: 'Created At' },
      { value: 'name', label: 'Name' },
      { value: 'price', label: 'Price' },
      { value: 'updatedAt', label: 'Updated At' },
    ],
  },
  {
    key: 'sortOrder',
    label: 'Order',
    type: 'select',
    placeholder: 'Default',
    options: [
      { value: 'asc', label: 'Ascending' },
      { value: 'desc', label: 'Descending' },
    ],
  },
];

export function ProductsFilters({ initialValues, categoryOptions }: ProductsFiltersProps) {
  const configs: FilterConfig[] = [
    ...filterConfigs.slice(0, 3),
    {
      key: 'categoryId',
      label: 'Category',
      type: 'combobox',
      placeholder: 'All Categories',
      options: categoryOptions,
    },
    ...filterConfigs.slice(3),
  ];

  const { values, setFilter, resetFilters } = useFilterParams('/dashboard/products', configs);

  return (
    <DataTableFilters
      filters={configs}
      values={values}
      onChange={setFilter}
      onReset={resetFilters}
    />
  );
}
