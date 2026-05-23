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

vi.mock('nuqs', () => ({
  parseAsInteger: { withDefault: vi.fn().mockReturnThis() },
  parseAsString: { withDefault: vi.fn().mockReturnThis() },
  parseAsArrayOf: vi.fn().mockReturnValue({ withDefault: vi.fn().mockReturnThis() }),
  useQueryStates: vi.fn(() => [defaultFilters, mockSetFilters]),
}));

vi.mock('../../apps/client/src/hooks/use-filters', () => ({
  useFilters: mockUseFilters,
}));

import { AvailabilityFilter } from '../../apps/client/src/components/filters/availability-filter';

describe('AvailabilityFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFilters.mockReturnValue([defaultFilters, mockSetFilters]);
  });

  it('renders In Stock checkbox option', () => {
    render(<AvailabilityFilter />);

    const inStockOption = screen.getByTestId('availability-in-stock');
    expect(inStockOption).toBeInTheDocument();
    expect(screen.getByText('In Stock')).toBeInTheDocument();

    const checkbox = inStockOption.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeInTheDocument();
  });

  it('renders Out of Stock checkbox option', () => {
    render(<AvailabilityFilter />);

    const outOfStockOption = screen.getByTestId('availability-out-of-stock');
    expect(outOfStockOption).toBeInTheDocument();
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();

    const checkbox = outOfStockOption.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeInTheDocument();
  });

  it('toggling availability updates filter state', () => {
    render(<AvailabilityFilter />);

    const inStockLabel = screen.getByTestId('availability-in-stock');
    const inStockCheckbox = inStockLabel.querySelector('input[type="checkbox"]');
    fireEvent.click(inStockCheckbox!);

    expect(mockSetFilters).toHaveBeenCalledWith({
      availability: ['in_stock'],
      page: 1,
    });
  });

  it('shows product count next to each option when facetCounts provided', () => {
    render(<AvailabilityFilter facetCounts={{ in_stock: 42, out_of_stock: 8, pre_order: 3 }} />);

    expect(screen.getByTestId('in-stock-count')).toHaveTextContent('(42)');
    expect(screen.getByTestId('out-of-stock-count')).toHaveTextContent('(8)');
  });

  it('renders Pre-Order checkbox option', () => {
    render(<AvailabilityFilter />);

    const preOrderOption = screen.getByTestId('availability-pre-order');
    expect(preOrderOption).toBeInTheDocument();
    expect(screen.getByText('Pre-Order')).toBeInTheDocument();

    const checkbox = preOrderOption.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeInTheDocument();
  });

  it('toggling pre_order updates filter state', () => {
    render(<AvailabilityFilter />);

    const preOrderLabel = screen.getByTestId('availability-pre-order');
    const preOrderCheckbox = preOrderLabel.querySelector('input[type="checkbox"]');
    fireEvent.click(preOrderCheckbox!);

    expect(mockSetFilters).toHaveBeenCalledWith({
      availability: ['pre_order'],
      page: 1,
    });
  });

  it('shows pre-order count when facetCounts provided', () => {
    render(<AvailabilityFilter facetCounts={{ in_stock: 42, out_of_stock: 8, pre_order: 3 }} />);

    expect(screen.getByTestId('pre-order-count')).toHaveTextContent('(3)');
  });
});
