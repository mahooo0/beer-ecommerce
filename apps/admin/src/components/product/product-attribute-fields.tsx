'use client';

/**
 * ProductAttributeFields — the normalized (4fr-style) attribute-value picker for
 * the product form.
 *
 * Given the currently-selected `categoryId`, it fetches that category's
 * `Attribute[]` (with their reusable `AttributeValue[]` "common options") via
 * `useAttributesByCategory` and renders one control block per attribute,
 * switching on `attr.displayType`:
 *   - checkbox → multi-select checklist
 *   - select   → single-select native dropdown
 *   - button   → single-select toggle buttons (pill chips)
 *   - color    → single-select colour swatches (uses AttributeValue.colorCode)
 *   - range    → single-select buttons (numeric-ish values), same UX as button
 *
 * The admin's picks are lifted into the parent RHF form as a flat
 * `attributeValues: { attributeId, attributeValueId }[]` array (the shape the
 * flat product schema + PUT /attributes/product/:id expect). Selection state is
 * derived from that array — this component is fully controlled.
 *
 * Ported from 4fr's `AttributeValuesSection` normalized selection logic, minus
 * the inline value CRUD / "primary variation axis" / per-toggle server saves:
 * taranka has NO variants and this form persists everything on submit.
 */

import { useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Attribute, AttributeValue } from '@repo/types';
import type { ProductAttributeValueInput } from '@/lib/api';
import { useAttributesByCategory } from '@/lib/queries/attributes';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface ProductAttributeFieldsProps {
  /** Currently selected category (cuid string). Empty/undefined → nothing to show. */
  categoryId: string | null | undefined;
  /** Current selections lifted from the RHF form. */
  value: ProductAttributeValueInput[];
  /** Emits the new full selection array back into the form. */
  onChange: (values: ProductAttributeValueInput[]) => void;
}

/** Effective label for a value: displayValue falls back to the machine value. */
function valueLabel(v: AttributeValue): string {
  return v.displayValue?.trim() || v.value;
}

/** Whether a given displayType allows multiple selections. */
function isMultiSelect(displayType: string): boolean {
  return displayType === 'checkbox';
}

export function ProductAttributeFields({
  categoryId,
  value,
  onChange,
}: ProductAttributeFieldsProps) {
  const { t } = useTranslation();
  const {
    data: attributes,
    isLoading,
    isError,
  } = useAttributesByCategory(categoryId, { enabled: !!categoryId });

  // Map attributeId -> Set<attributeValueId> for O(1) "is selected" checks.
  const selectedMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const sel of value) {
      if (!map.has(sel.attributeId)) map.set(sel.attributeId, new Set());
      map.get(sel.attributeId)!.add(sel.attributeValueId);
    }
    return map;
  }, [value]);

  // When the category's attribute set changes, prune any selections whose
  // attribute/value no longer belongs to this category (e.g. stale rows loaded
  // from a product that later switched category branches). The hard reset on a
  // *category change* is handled by the parent form; this only trims orphans.
  useEffect(() => {
    if (!attributes) return;
    const validAttr = new Map<string, Set<string>>();
    for (const attr of attributes) {
      validAttr.set(
        attr.id,
        new Set((attr.values ?? []).map((v) => v.id))
      );
    }
    const pruned = value.filter(
      (sel) =>
        validAttr.has(sel.attributeId) &&
        validAttr.get(sel.attributeId)!.has(sel.attributeValueId)
    );
    if (pruned.length !== value.length) {
      onChange(pruned);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributes]);

  // Toggle a value in a multi-select (checkbox) attribute.
  const toggleMulti = useCallback(
    (attributeId: string, valueId: string) => {
      const exists = value.some(
        (s) => s.attributeId === attributeId && s.attributeValueId === valueId
      );
      const next = exists
        ? value.filter(
            (s) =>
              !(s.attributeId === attributeId && s.attributeValueId === valueId)
          )
        : [...value, { attributeId, attributeValueId: valueId }];
      onChange(next);
    },
    [value, onChange]
  );

  // Set (or clear) the single value of a single-select attribute.
  const setSingle = useCallback(
    (attributeId: string, valueId: string | null) => {
      // Drop every existing selection for this attribute, then add the new one.
      const withoutAttr = value.filter((s) => s.attributeId !== attributeId);
      const next = valueId
        ? [...withoutAttr, { attributeId, attributeValueId: valueId }]
        : withoutAttr;
      onChange(next);
    },
    [value, onChange]
  );

  if (!categoryId) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('productForm.attributes.selectCategoryFirst')}
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" />
        {t('productForm.attributes.loading')}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {t('productForm.attributes.loadError')}
      </p>
    );
  }

  if (!attributes || attributes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('productForm.attributes.empty')}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {attributes.map((attr) => (
        <AttributeControl
          key={attr.id}
          attr={attr}
          selected={selectedMap.get(attr.id) ?? new Set()}
          onToggleMulti={(valueId) => toggleMulti(attr.id, valueId)}
          onSetSingle={(valueId) => setSingle(attr.id, valueId)}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// One attribute's control block, switched on displayType.
// ---------------------------------------------------------------------------

function AttributeControl({
  attr,
  selected,
  onToggleMulti,
  onSetSingle,
}: {
  attr: Attribute;
  selected: Set<string>;
  onToggleMulti: (valueId: string) => void;
  onSetSingle: (valueId: string | null) => void;
}) {
  const { t } = useTranslation();
  // Values arrive pre-sorted by AttributeValue.sortOrder from the server.
  const values = (attr.values ?? []).filter((v) => v.isActive !== false);
  const multi = isMultiSelect(attr.displayType);
  const currentSingle =
    !multi && selected.size ? Array.from(selected)[0] : null;

  const header = (
    <div className="flex items-center gap-2">
      <Label className="text-sm font-medium">{attr.displayName}</Label>
      <Badge variant="outline" className="text-[10px] uppercase">
        {attr.displayType}
      </Badge>
    </div>
  );

  if (values.length === 0) {
    return (
      <div className="space-y-2">
        {header}
        <p className="text-xs text-muted-foreground">
          {t('productForm.attributes.noValues')}
        </p>
      </div>
    );
  }

  // -- checkbox: multi-select checklist ------------------------------------
  if (attr.displayType === 'checkbox') {
    return (
      <div className="space-y-2">
        {header}
        <div className="space-y-1 max-h-56 overflow-y-auto rounded-md border p-2">
          {values.map((v) => {
            const checked = selected.has(v.id);
            return (
              <label
                key={v.id}
                className="flex items-center gap-2 py-1 px-1 rounded cursor-pointer hover:bg-muted/50 text-sm"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary"
                  checked={checked}
                  onChange={() => onToggleMulti(v.id)}
                />
                <span className="truncate">{valueLabel(v)}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  // -- select: single-select native dropdown -------------------------------
  if (attr.displayType === 'select') {
    return (
      <div className="space-y-2">
        {header}
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={currentSingle ?? ''}
          onChange={(e) => onSetSingle(e.target.value || null)}
        >
          <option value="">{t('productForm.attributes.notSet')}</option>
          {values.map((v) => (
            <option key={v.id} value={v.id}>
              {valueLabel(v)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // -- color: single-select swatches ---------------------------------------
  if (attr.displayType === 'color') {
    return (
      <div className="space-y-2">
        {header}
        <div className="flex flex-wrap gap-2">
          {values.map((v) => {
            const isSel = currentSingle === v.id;
            return (
              <button
                key={v.id}
                type="button"
                title={valueLabel(v)}
                onClick={() => onSetSingle(isSel ? null : v.id)}
                className={cn(
                  'relative h-8 w-8 rounded-full border-2 transition-all',
                  isSel
                    ? 'border-primary ring-2 ring-primary/30 scale-110'
                    : 'border-border hover:scale-105'
                )}
                style={{ backgroundColor: v.colorCode || '#e5e7eb' }}
              >
                {isSel && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // -- button / range: single-select pill buttons --------------------------
  return (
    <div className="space-y-2">
      {header}
      <div className="flex flex-wrap gap-2">
        {values.map((v) => {
          const isSel = currentSingle === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSetSingle(isSel ? null : v.id)}
              className={cn(
                'px-3 py-1.5 rounded-md border text-sm transition-colors',
                isSel
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-transparent hover:bg-muted border-input'
              )}
            >
              {valueLabel(v)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
