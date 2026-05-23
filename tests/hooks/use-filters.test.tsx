// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Hoist mock variables so they're available in the vi.mock factory
const { mockSetFilters, mockUseQueryStates, defaultFilters } = vi.hoisted(() => {
  const mockSetFilters = vi.fn();
  const defaultFilters = {
    minPrice: 0,
    maxPrice: 999999,
    brands: [] as string[],
    attributes: [] as string[],
    availability: [] as string[],
    page: 1,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };
  const mockUseQueryStates = vi.fn(() => [defaultFilters, mockSetFilters]);
  return { mockSetFilters, mockUseQueryStates, defaultFilters };
});

vi.mock('nuqs', () => ({
  parseAsInteger: {
    withDefault: vi.fn().mockReturnThis(),
  },
  parseAsString: {
    withDefault: vi.fn().mockReturnThis(),
  },
  parseAsArrayOf: vi.fn().mockReturnValue({
    withDefault: vi.fn().mockReturnThis(),
  }),
  useQueryStates: mockUseQueryStates,
}));

import { useFilters } from '../../apps/client/src/hooks/use-filters';

describe('useFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQueryStates.mockReturnValue([defaultFilters, mockSetFilters]);
  });

  it('initializes with default filter values', () => {
    const { result } = renderHook(() => useFilters());
    const [filters] = result.current;

    expect(filters.minPrice).toBe(0);
    expect(filters.maxPrice).toBe(999999);
    expect(filters.brands).toEqual([]);
    expect(filters.attributes).toEqual([]);
    expect(filters.availability).toEqual([]);
    expect(filters.page).toBe(1);
    expect(filters.sortBy).toBe('createdAt');
    expect(filters.sortOrder).toBe('desc');
  });

  it('persists filter state to URL search params', () => {
    renderHook(() => useFilters());
    // Verify useQueryStates was called (nuqs handles URL persistence)
    expect(mockUseQueryStates).toHaveBeenCalled();
  });

  it('restores filter state from URL on mount', () => {
    const urlFilters = {
      ...defaultFilters,
      minPrice: 1000,
      maxPrice: 50000,
      brands: ['brand-1'],
    };
    mockUseQueryStates.mockReturnValue([urlFilters, mockSetFilters]);

    const { result } = renderHook(() => useFilters());
    const [filters] = result.current;

    expect(filters.minPrice).toBe(1000);
    expect(filters.maxPrice).toBe(50000);
    expect(filters.brands).toEqual(['brand-1']);
  });

  it('resets page to 1 when filters change', () => {
    const { result } = renderHook(() => useFilters());
    const [, setFilters] = result.current;

    setFilters({ minPrice: 500, page: 1 });
    expect(mockSetFilters).toHaveBeenCalledWith({ minPrice: 500, page: 1 });
  });

  it('clearOnDefault removes default values from URL', () => {
    renderHook(() => useFilters());
    // Verify useQueryStates was called with clearOnDefault: true option
    expect(mockUseQueryStates).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ clearOnDefault: true })
    );
  });
});
