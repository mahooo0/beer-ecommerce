'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ProductVariantDetail } from '@/types/product-detail';

interface OptionGroup {
  name: string;
  displayName: string;
  values: string[];
}

interface VariantMatrixEntry {
  variantId: string;
  stock: number;
  price: number;
  images: string[];
  sku: string;
  variant: ProductVariantDetail;
}

function buildVariantMatrix(
  variants: ProductVariantDetail[],
): Map<string, VariantMatrixEntry> {
  const matrix = new Map<string, VariantMatrixEntry>();

  for (const variant of variants) {
    const parts = variant.options
      .map((o) => `${o.option.group.name}:${o.option.value}`)
      .sort();
    const key = parts.join('|');

    matrix.set(key, {
      variantId: variant.id,
      stock: variant.stock ?? 0,
      price: variant.price,
      images: (variant as { images?: string[] }).images ?? [],
      sku: variant.sku ?? '',
      variant,
    });
  }

  return matrix;
}

function extractOptionGroups(variants: ProductVariantDetail[]): OptionGroup[] {
  const groupMap = new Map<string, OptionGroup>();

  for (const variant of variants) {
    for (const optionData of variant.options) {
      const { name, displayName } = optionData.option.group;
      if (!groupMap.has(name)) {
        groupMap.set(name, { name, displayName, values: [] });
      }
      const group = groupMap.get(name)!;
      if (!group.values.includes(optionData.option.value)) {
        group.values.push(optionData.option.value);
      }
    }
  }

  return Array.from(groupMap.values());
}

function buildSelectionKey(
  groups: OptionGroup[],
  selections: Record<string, string>,
): string {
  return groups
    .map((g) => `${g.name}:${selections[g.name] ?? ''}`)
    .sort()
    .join('|');
}

function isValueAvailable(
  groupName: string,
  value: string,
  currentSelections: Record<string, string>,
  groups: OptionGroup[],
  matrix: Map<string, VariantMatrixEntry>,
): boolean {
  // Build the selection with this group set to the candidate value
  const testSelections = { ...currentSelections, [groupName]: value };

  // Check if any variant matches all current selections plus this candidate
  for (const [key] of matrix) {
    const parts = key.split('|');
    const keyMap: Record<string, string> = {};
    for (const part of parts) {
      const colonIdx = part.indexOf(':');
      if (colonIdx !== -1) {
        keyMap[part.slice(0, colonIdx)] = part.slice(colonIdx + 1);
      }
    }

    // Verify this variant entry matches all selections in testSelections
    let matches = true;
    for (const group of groups) {
      const selectedVal = testSelections[group.name];
      if (selectedVal && keyMap[group.name] !== selectedVal) {
        matches = false;
        break;
      }
    }

    if (matches) return true;
  }

  return false;
}

interface VariantSelectorProps {
  variants: ProductVariantDetail[];
  onVariantChange: (variant: ProductVariantDetail | null) => void;
}

export function VariantSelector({ variants, onVariantChange }: VariantSelectorProps) {
  const groups = useMemo(() => extractOptionGroups(variants), [variants]);
  const matrix = useMemo(() => buildVariantMatrix(variants), [variants]);

  // Initialize selections from the first variant
  const getInitialSelections = (): Record<string, string> => {
    const first = variants[0];
    if (!first) return {};
    const result: Record<string, string> = {};
    for (const optionData of first.options) {
      result[optionData.option.group.name] = optionData.option.value;
    }
    return result;
  };

  const [selections, setSelections] = useState<Record<string, string>>(getInitialSelections);

  // Fire onVariantChange whenever selections change
  useEffect(() => {
    if (groups.length === 0) return;
    const key = buildSelectionKey(groups, selections);
    const entry = matrix.get(key);
    onVariantChange(entry ? entry.variant : null);
  }, [selections, groups, matrix, onVariantChange]);

  if (groups.length === 0) return null;

  function handleChange(groupName: string, value: string) {
    setSelections((prev) => ({ ...prev, [groupName]: value }));
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.name}>
          <label
            htmlFor={`variant-${group.name}`}
            className="block text-sm font-medium text-secondary mb-1"
          >
            {group.displayName}
          </label>
          <select
            id={`variant-${group.name}`}
            value={selections[group.name] ?? ''}
            onChange={(e) => handleChange(group.name, e.target.value)}
            className="border border-border-primary rounded-lg px-3 py-2 bg-primary w-full focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          >
            {group.values.map((value) => {
              const available = isValueAvailable(
                group.name,
                value,
                selections,
                groups,
                matrix,
              );
              return (
                <option
                  key={value}
                  value={value}
                  disabled={!available}
                  className={!available ? 'opacity-50 text-quaternary' : ''}
                >
                  {value}
                </option>
              );
            })}
          </select>
        </div>
      ))}
    </div>
  );
}
