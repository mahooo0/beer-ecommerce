'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useFilters } from '../../hooks/use-filters';

interface PriceFilterProps {
  minPrice: number;
  maxPrice: number;
}

function centsToDisplayDollars(cents: number): string {
  return (cents / 100).toFixed(0);
}

function displayDollarsToCents(dollars: string): number {
  const parsed = parseFloat(dollars);
  if (isNaN(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

export function PriceFilter({ minPrice, maxPrice }: PriceFilterProps) {
  const [filters, setFilters] = useFilters();

  const [localMin, setLocalMin] = useState(filters.minPrice || minPrice);
  const [localMax, setLocalMax] = useState(filters.maxPrice !== 999999 ? filters.maxPrice : maxPrice);

  const minThumbRef = useRef<HTMLDivElement>(null);
  const maxThumbRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<'min' | 'max' | null>(null);

  useEffect(() => {
    setLocalMin(filters.minPrice || minPrice);
    setLocalMax(filters.maxPrice !== 999999 ? filters.maxPrice : maxPrice);
  }, [filters.minPrice, filters.maxPrice, minPrice, maxPrice]);

  const debouncedUpdateUrl = useDebouncedCallback(
    (newMin: number, newMax: number) => {
      setFilters({
        minPrice: newMin <= minPrice ? 0 : newMin,
        maxPrice: newMax >= maxPrice ? 999999 : newMax,
        page: 1,
      });
    },
    300
  );

  const range = maxPrice - minPrice;
  const minPercent = range > 0 ? ((localMin - minPrice) / range) * 100 : 0;
  const maxPercent = range > 0 ? ((localMax - minPrice) / range) * 100 : 100;

  const GAP = 100; // minimum gap in cents ($1)

  const getValueFromPosition = useCallback(
    (clientX: number): number => {
      if (!trackRef.current) return minPrice;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      // Snap to step
      const raw = minPrice + percent * range;
      return Math.round(raw / GAP) * GAP;
    },
    [minPrice, range]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, type: 'min' | 'max') => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      draggingRef.current = type;
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const value = getValueFromPosition(e.clientX);

      if (draggingRef.current === 'min') {
        const clamped = Math.max(minPrice, Math.min(value, localMax - GAP));
        setLocalMin(clamped);
        debouncedUpdateUrl(clamped, localMax);
      } else {
        const clamped = Math.min(maxPrice, Math.max(value, localMin + GAP));
        setLocalMax(clamped);
        debouncedUpdateUrl(localMin, clamped);
      }
    },
    [getValueFromPosition, localMin, localMax, minPrice, maxPrice, debouncedUpdateUrl]
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  // Click on track — move nearest thumb
  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (draggingRef.current) return;
      const value = getValueFromPosition(e.clientX);
      const distToMin = Math.abs(value - localMin);
      const distToMax = Math.abs(value - localMax);

      if (distToMin <= distToMax) {
        const clamped = Math.max(minPrice, Math.min(value, localMax - GAP));
        setLocalMin(clamped);
        debouncedUpdateUrl(clamped, localMax);
      } else {
        const clamped = Math.min(maxPrice, Math.max(value, localMin + GAP));
        setLocalMax(clamped);
        debouncedUpdateUrl(localMin, clamped);
      }
    },
    [getValueFromPosition, localMin, localMax, minPrice, maxPrice, debouncedUpdateUrl]
  );

  const handleInputChange = useCallback(
    (type: 'min' | 'max', value: string) => {
      const cents = displayDollarsToCents(value);
      if (type === 'min') {
        const clamped = Math.max(minPrice, Math.min(cents, localMax - GAP));
        setLocalMin(clamped);
        debouncedUpdateUrl(clamped, localMax);
      } else {
        const clamped = Math.min(maxPrice, Math.max(cents, localMin + GAP));
        setLocalMax(clamped);
        debouncedUpdateUrl(localMin, clamped);
      }
    },
    [minPrice, maxPrice, localMin, localMax, debouncedUpdateUrl]
  );

  const handleReset = () => {
    setLocalMin(minPrice);
    setLocalMax(maxPrice);
    setFilters({ minPrice: 0, maxPrice: 999999, page: 1 });
  };

  const hasActiveFilter = localMin > minPrice || localMax < maxPrice;

  return (
    <div className="space-y-4" data-testid="price-filter">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-primary">Price Range</h3>
        {hasActiveFilter && (
          <button
            onClick={handleReset}
            className="text-xs font-medium text-brand-secondary hover:text-brand-primary transition-colors"
            data-testid="price-filter-reset"
          >
            Reset
          </button>
        )}
      </div>

      {/* Custom dual-thumb range slider */}
      <div
        className="relative h-10 flex items-center select-none touch-none"
        data-testid="price-slider"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Track background */}
        <div
          ref={trackRef}
          className="relative w-full h-1.5 rounded-full bg-secondary_subtle cursor-pointer"
          onClick={handleTrackClick}
        >
          {/* Active range fill */}
          <div
            className="absolute h-full rounded-full bg-brand-solid transition-[left,right] duration-75"
            style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
          />
        </div>

        {/* Min thumb */}
        <div
          ref={minThumbRef}
          role="slider"
          tabIndex={0}
          aria-label="Minimum price"
          aria-valuemin={minPrice / 100}
          aria-valuemax={maxPrice / 100}
          aria-valuenow={localMin / 100}
          aria-valuetext={`$${centsToDisplayDollars(localMin)}`}
          className="absolute -translate-x-1/2 -translate-y-1/2 top-1/2 w-5 h-5 rounded-full border-2 shadow-sm cursor-grab active:cursor-grabbing active:scale-110 transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          style={{
            left: `${minPercent}%`,
            backgroundColor: 'var(--color-slider-handle-bg)',
            borderColor: 'var(--color-slider-handle-border)',
            zIndex: draggingRef.current === 'min' ? 20 : 10,
          }}
          onPointerDown={(e) => handlePointerDown(e, 'min')}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
              e.preventDefault();
              const next = Math.min(localMin + GAP, localMax - GAP);
              setLocalMin(next);
              debouncedUpdateUrl(next, localMax);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
              e.preventDefault();
              const next = Math.max(localMin - GAP, minPrice);
              setLocalMin(next);
              debouncedUpdateUrl(next, localMax);
            }
          }}
          data-testid="price-slider-min"
        />

        {/* Max thumb */}
        <div
          ref={maxThumbRef}
          role="slider"
          tabIndex={0}
          aria-label="Maximum price"
          aria-valuemin={minPrice / 100}
          aria-valuemax={maxPrice / 100}
          aria-valuenow={localMax / 100}
          aria-valuetext={`$${centsToDisplayDollars(localMax)}`}
          className="absolute -translate-x-1/2 -translate-y-1/2 top-1/2 w-5 h-5 rounded-full border-2 shadow-sm cursor-grab active:cursor-grabbing active:scale-110 transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          style={{
            left: `${maxPercent}%`,
            backgroundColor: 'var(--color-slider-handle-bg)',
            borderColor: 'var(--color-slider-handle-border)',
            zIndex: draggingRef.current === 'max' ? 20 : 10,
          }}
          onPointerDown={(e) => handlePointerDown(e, 'max')}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
              e.preventDefault();
              const next = Math.min(localMax + GAP, maxPrice);
              setLocalMax(next);
              debouncedUpdateUrl(localMin, next);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
              e.preventDefault();
              const next = Math.max(localMax - GAP, localMin + GAP);
              setLocalMax(next);
              debouncedUpdateUrl(localMin, next);
            }
          }}
          data-testid="price-slider-max"
        />
      </div>

      {/* Min/Max input fields */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-xs font-medium text-tertiary mb-1 block">Min ($)</label>
          <input
            type="number"
            min={0}
            max={parseInt(centsToDisplayDollars(localMax)) - 1}
            value={centsToDisplayDollars(localMin)}
            onChange={(e) => handleInputChange('min', e.target.value)}
            className="w-full px-3 py-1.5 text-sm text-primary bg-primary border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand-solid transition-colors"
            data-testid="price-input-min"
            aria-label="Minimum price input"
          />
        </div>
        <span className="text-tertiary mt-5 text-sm">—</span>
        <div className="flex-1">
          <label className="text-xs font-medium text-tertiary mb-1 block">Max ($)</label>
          <input
            type="number"
            min={parseInt(centsToDisplayDollars(localMin)) + 1}
            value={centsToDisplayDollars(localMax)}
            onChange={(e) => handleInputChange('max', e.target.value)}
            className="w-full px-3 py-1.5 text-sm text-primary bg-primary border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand-solid transition-colors"
            data-testid="price-input-max"
            aria-label="Maximum price input"
          />
        </div>
      </div>
    </div>
  );
}
