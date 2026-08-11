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
      // Server components read these from searchParams, so a filter change must
      // trigger a real navigation (re-fetch) — not a shallow client-only update.
      shallow: false,
      clearOnDefault: true,
    }
  );
}
