// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { mockSetFilters, mockUseFilters, defaultFilters } = vi.hoisted(() => {
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
  const mockUseFilters = vi.fn(() => [defaultFilters, mockSetFilters]);
  return { mockSetFilters, mockUseFilters, defaultFilters };
});

vi.mock('/Users/muhemmedibrahimov/work/beer-ecommerce/apps/client/src/hooks/use-filters', () => ({
  useFilters: mockUseFilters,
}));

vi.mock('nuqs', () => ({
  parseAsInteger: { withDefault: vi.fn().mockReturnThis() },
  parseAsString: { withDefault: vi.fn().mockReturnThis() },
  parseAsArrayOf: vi.fn().mockReturnValue({ withDefault: vi.fn().mockReturnThis() }),
  useQueryStates: vi.fn(() => [defaultFilters, mockSetFilters]),
}));

import { FilterButton } from '../../apps/client/src/components/filters/filter-button';
import { FilterDrawer } from '../../apps/client/src/components/filters/filter-drawer';

describe('FilterDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFilters.mockReturnValue([defaultFilters, mockSetFilters]);
  });

  it('renders filter button on mobile with active count badge', () => {
    render(<FilterButton activeFilterCount={3} />);

    const button = screen.getByTestId('filter-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('lg:hidden');

    const badge = screen.getByTestId('filter-count-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('3');
  });

  it('opens Sheet drawer on button click', () => {
    render(
      <FilterDrawer categoryAttributes={[]} facetCounts={{
        brands: [],
        attributes: {},
        availability: {},
        priceRange: { min: 0, max: 100000 },
      }} />
    );

    // Initially closed - filter-drawer-content should not be visible
    expect(screen.queryByTestId('filter-drawer-content')).not.toBeInTheDocument();

    // Click the filter button to open
    const button = screen.getByTestId('filter-button');
    fireEvent.click(button);

    // Now drawer content should be visible
    const drawerContent = screen.getByTestId('filter-drawer-content');
    expect(drawerContent).toBeInTheDocument();
  });

  it('Apply button commits pending filters to URL', () => {
    const activeFilters = {
      ...defaultFilters,
      brands: ['Nike', 'Adidas'],
    };
    mockUseFilters.mockReturnValue([activeFilters, mockSetFilters]);

    render(
      <FilterDrawer categoryAttributes={[]} facetCounts={{
        brands: [],
        attributes: {},
        availability: {},
        priceRange: { min: 0, max: 100000 },
      }} />
    );

    // Open drawer
    fireEvent.click(screen.getByTestId('filter-button'));

    // Click Apply
    const applyButton = screen.getByTestId('apply-filters-button');
    fireEvent.click(applyButton);

    // setFilters should have been called
    expect(mockSetFilters).toHaveBeenCalled();
  });

  it('Clear All button resets all filter values', () => {
    const activeFilters = {
      ...defaultFilters,
      brands: ['Nike'],
      minPrice: 1000,
    };
    mockUseFilters.mockReturnValue([activeFilters, mockSetFilters]);

    render(
      <FilterDrawer categoryAttributes={[]} facetCounts={{
        brands: [],
        attributes: {},
        availability: {},
        priceRange: { min: 0, max: 100000 },
      }} />
    );

    // Open drawer
    fireEvent.click(screen.getByTestId('filter-button'));

    // Click Clear All
    const clearButton = screen.getByTestId('clear-all-filters-button');
    fireEvent.click(clearButton);

    // setFilters should be called with defaults
    expect(mockSetFilters).toHaveBeenCalledWith({
      minPrice: 0,
      maxPrice: 999999,
      brands: [],
      attributes: [],
      availability: [],
      page: 1,
    });
  });
});
