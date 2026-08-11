'use client';

import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

/**
 * Single nuqs-backed source of truth for catalog filter state (shared by the
 * base `/categories` stack and the Taranka `/products` stack).
 *
 * `shallow: false` — server components read these from `searchParams`, so a
 * filter change must trigger a real navigation (re-fetch), not a client-only
 * URL patch. `clearOnDefault` keeps default values out of the URL.
 *
 * Keys are a superset: the base stack drives `sortBy`/`sortOrder`; the Taranka
 * catalog server reads `sort`/`category`/`search`. Unused keys stay at their
 * default (and therefore absent from the URL), so both stacks coexist cleanly.
 */
export function useFilters() {
  return useQueryStates(
    {
      minPrice: parseAsInteger.withDefault(0),
      maxPrice: parseAsInteger.withDefault(999999),
      brands: parseAsArrayOf(parseAsString).withDefault([]),
      attributes: parseAsArrayOf(parseAsString).withDefault([]),
      availability: parseAsArrayOf(parseAsString).withDefault([]),
      page: parseAsInteger.withDefault(1),
      // Base stack (`/categories/[slug]`).
      sortBy: parseAsString.withDefault('createdAt'),
      sortOrder: parseAsString.withDefault('desc'),
      // Taranka stack (`/products`): the server reads these param names directly.
      sort: parseAsString.withDefault('newest'),
      category: parseAsString.withDefault(''),
      search: parseAsString.withDefault(''),
    },
    {
      history: 'push',
      shallow: false,
      clearOnDefault: true,
    }
  );
}
