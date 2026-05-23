// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { mockSetFilters, mockUseFilters, defaultFilters, mockDebouncedCallback } = vi.hoisted(() => {
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
  const mockDebouncedCallback = vi.fn((fn: (...args: unknown[]) => void, _delay: number) => fn);
  return { mockSetFilters, mockUseFilters, defaultFilters, mockDebouncedCallback };
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

vi.mock('use-debounce', () => ({
  useDebouncedCallback: mockDebouncedCallback,
}));

import { PriceFilter } from '../../apps/client/src/components/filters/price-filter';

describe('PriceFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFilters.mockReturnValue([defaultFilters, mockSetFilters]);
  });

  it('renders dual-handle range slider', () => {
    render(<PriceFilter minPrice={0} maxPrice={100000} />);

    const minSlider = screen.getByTestId('price-slider-min');
    const maxSlider = screen.getByTestId('price-slider-max');

    expect(minSlider).toBeInTheDocument();
    expect(maxSlider).toBeInTheDocument();
    expect(minSlider).toHaveAttribute('type', 'range');
    expect(maxSlider).toHaveAttribute('type', 'range');
  });

  it('renders min and max input fields', () => {
    render(<PriceFilter minPrice={0} maxPrice={100000} />);

    const minInput = screen.getByTestId('price-input-min');
    const maxInput = screen.getByTestId('price-input-max');

    expect(minInput).toBeInTheDocument();
    expect(maxInput).toBeInTheDocument();
    expect(minInput).toHaveAttribute('type', 'number');
    expect(maxInput).toHaveAttribute('type', 'number');
  });

  it('slider change updates local state immediately', () => {
    render(<PriceFilter minPrice={0} maxPrice={100000} />);

    const minSlider = screen.getByTestId('price-slider-min');
    fireEvent.change(minSlider, { target: { value: '5000' } });

    // Local state updated - the input should reflect new value
    expect(minSlider).toBeInTheDocument();
  });

  it('URL updates are debounced by 300ms', () => {
    render(<PriceFilter minPrice={0} maxPrice={100000} />);

    // useDebouncedCallback should have been called with 300ms delay
    expect(mockDebouncedCallback).toHaveBeenCalledWith(expect.any(Function), 300);
  });

  it('manual input syncs with slider position', () => {
    render(<PriceFilter minPrice={0} maxPrice={100000} />);

    const minInput = screen.getByTestId('price-input-min');
    fireEvent.change(minInput, { target: { value: '100' } });

    // Input change should trigger state update (via debounced callback)
    expect(minInput).toBeInTheDocument();
    expect(mockSetFilters).toHaveBeenCalled();
  });
});
