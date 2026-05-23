'use client';

import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

export function useFilters() {
  return useQueryStates(
    {
      minPrice: parseAsInteger.withDefault(0),
      maxPrice: parseAsInteger.withDefault(999999),
      brands: parseAsArrayOf(parseAsString).withDefault([]),
      attributes: parseAsArrayOf(parseAsString).withDefault([]),
      availability: parseAsArrayOf(parseAsString).withDefault([]),
      page: parseAsInteger.withDefault(1),
      sortBy: parseAsString.withDefault('createdAt'),
      sortOrder: parseAsString.withDefault('desc'),
    },
    {
      history: 'push',
      shallow: true,
      clearOnDefault: true,
    }
  );
}
