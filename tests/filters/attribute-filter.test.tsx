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

import { AttributeFilter } from '../../apps/client/src/components/filters/attribute-filter';
import type { CategoryAttribute } from '@repo/types';

const selectAttribute: CategoryAttribute = {
  id: 'attr-1',
  categoryId: 'cat-1',
  name: 'Screen Size',
  key: 'screen_size',
  type: 'SELECT',
  values: ['32 inch', '55 inch', '65 inch'],
  unit: 'inch',
  isFilterable: true,
  isRequired: false,
  position: 0,
};

const rangeAttribute: CategoryAttribute = {
  id: 'attr-2',
  categoryId: 'cat-1',
  name: 'Storage',
  key: 'storage',
  type: 'RANGE',
  values: ['64', '128', '256', '512'],
  unit: 'GB',
  isFilterable: true,
  isRequired: false,
  position: 1,
};

const booleanAttribute: CategoryAttribute = {
  id: 'attr-3',
  categoryId: 'cat-1',
  name: 'Water Resistant',
  key: 'water_resistant',
  type: 'BOOLEAN',
  values: [],
  isFilterable: true,
  isRequired: false,
  position: 2,
};

describe('AttributeFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFilters.mockReturnValue([defaultFilters, mockSetFilters]);
  });

  it('renders SELECT attributes as checkbox groups', () => {
    render(<AttributeFilter attribute={selectAttribute} />);

    expect(screen.getByText('Screen Size')).toBeInTheDocument();
    expect(screen.getByTestId('attribute-option-32 inch')).toBeInTheDocument();
    expect(screen.getByTestId('attribute-option-55 inch')).toBeInTheDocument();
    expect(screen.getByTestId('attribute-option-65 inch')).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
  });

  it('renders RANGE attributes as slider', () => {
    render(<AttributeFilter attribute={rangeAttribute} />);

    expect(screen.getByText(/Storage/)).toBeInTheDocument();
    const slider = screen.getByTestId('attribute-range-slider-storage');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('type', 'range');
  });

  it('renders BOOLEAN attributes as single checkbox', () => {
    render(<AttributeFilter attribute={booleanAttribute} />);

    expect(screen.getByText('Water Resistant')).toBeInTheDocument();
    const checkbox = screen.getByTestId('attribute-boolean-water_resistant');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('type', 'checkbox');
  });

  it('shows facet count next to each checkbox value', () => {
    const facetCounts = [
      { value: '32 inch', count: 5 },
      { value: '55 inch', count: 12 },
    ];
    render(<AttributeFilter attribute={selectAttribute} facetCounts={facetCounts} />);

    const counts = screen.getAllByTestId('facet-count');
    expect(counts).toHaveLength(2);
    expect(counts[0]).toHaveTextContent('(5)');
    expect(counts[1]).toHaveTextContent('(12)');
  });

  it('toggling checkbox updates filter state', () => {
    render(<AttributeFilter attribute={selectAttribute} />);

    const option = screen.getByTestId('attribute-option-55 inch');
    const checkbox = option.querySelector('input[type="checkbox"]');
    fireEvent.click(checkbox!);

    expect(mockSetFilters).toHaveBeenCalledWith({
      attributes: ['screen_size:55 inch'],
      page: 1,
    });
  });
});
