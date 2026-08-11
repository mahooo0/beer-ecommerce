"use client";

import { useState, useEffect } from "react";
import { useFilters } from "@/hooks/use-filters";

interface CatalogFiltersProps {
  priceRange: { min: number; max: number };
  brands: Array<{ id: string; name: string; count: number }>;
}

const toZl = (cents: number) => Math.round(cents / 100);

/**
 * Taranka-styled catalog filter panel (Polish, zł). Deliberately minimal —
 * price range + brands — and NO in/out-of-stock filter (out-of-stock products
 * are greyed and sorted last on the cards instead). Writes the same URL filter
 * params as the rest of the catalog via `useFilters` (nuqs, shallow:false).
 */
export function CatalogFilters({ priceRange, brands }: CatalogFiltersProps) {
  const [filters, setFilters] = useFilters();

  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  useEffect(() => {
    setMin(filters.minPrice > 0 ? String(toZl(filters.minPrice)) : "");
    setMax(
      filters.maxPrice > 0 && filters.maxPrice !== 999999 ? String(toZl(filters.maxPrice)) : "",
    );
  }, [filters.minPrice, filters.maxPrice]);

  const applyPrice = () => {
    const minC = min.trim() ? Math.max(0, Math.round(parseFloat(min) * 100)) : 0;
    const maxC = max.trim() ? Math.round(parseFloat(max) * 100) : 999999;
    setFilters({ minPrice: minC, maxPrice: maxC || 999999, page: 1 });
  };

  const toggleBrand = (id: string) => {
    const current = filters.brands;
    const updated = current.includes(id)
      ? current.filter((b) => b !== id)
      : [...current, id];
    setFilters({ brands: updated, page: 1 });
  };

  const hasActive =
    filters.minPrice > 0 ||
    (filters.maxPrice > 0 && filters.maxPrice !== 999999) ||
    filters.brands.length > 0;

  const clearAll = () =>
    setFilters({
      minPrice: 0,
      maxPrice: 999999,
      brands: [],
      attributes: [],
      availability: [],
      page: 1,
    });

  const inputCls =
    "w-full rounded-lg border border-[#B5B2A7] bg-white px-3 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-red-500";

  return (
    <div className="w-[282px] rounded-2xl bg-[#E2DFD4] p-6 font-taranka-body">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink-900">Filtry</h3>
        {hasActive && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-brand-red-500 hover:underline"
          >
            Wyczyść
          </button>
        )}
      </div>

      {/* Cena */}
      <div className="mt-5">
        <p className="text-sm font-semibold text-ink-900">Cena, zł</p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            placeholder={String(toZl(priceRange.min))}
            aria-label="Cena od"
            className={inputCls}
          />
          <span className="text-[#9E9B90]">—</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            placeholder={String(toZl(priceRange.max))}
            aria-label="Cena do"
            className={inputCls}
          />
        </div>
        <button
          type="button"
          onClick={applyPrice}
          className="mt-3 w-full rounded-full bg-brand-red-500 py-2 text-sm font-medium text-cream-50 transition-colors hover:bg-brand-red-700"
        >
          Zastosuj
        </button>
      </div>

      {/* Marka (renders only when brand data exists) */}
      {brands.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-ink-900">Marka</p>
          <ul className="mt-2 space-y-2">
            {brands.map((b) => (
              <li key={b.id}>
                <label className="flex cursor-pointer items-center justify-between text-sm text-ink-900">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.brands.includes(b.id)}
                      onChange={() => toggleBrand(b.id)}
                      className="size-4 accent-brand-red-500"
                    />
                    {b.name}
                  </span>
                  <span className="text-xs text-[#9E9B90]">{b.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
