// Product completeness checker — used by the catalog table "Заповнення" column
// and the product detail/edit page widget. Returns a list of scored fields with
// per-field filled/missing flags so the UI can render a health-style bar and a
// clickable "what's missing" list.
//
// Ported from 4fr-ecom apps/admin/src/lib/product-completeness.ts and adapted to
// the taranka flat Product model (NO variants). The six SCORED fields match the
// server exactly (apps/server/src/modules/product/product.service.ts →
// countFilledCompletenessFields), so the client bar and the /completeness-stats
// endpoint always agree:
//
//   name · category · description · images · keywords (searchKeywords[]) · manufacturer
//
// The optional "attributes" slot is NOT part of the server score; it's an extra
// detail-page-only check rendered when the caller supplies category attribute
// defs + the product's filled attribute values. The catalog list endpoint
// returns neither, so the table cell passes `undefined` and the slot is skipped.

export type CompletenessFieldKey =
  | 'name'
  | 'category'
  | 'description'
  | 'images'
  | 'keywords'
  | 'manufacturer'
  | 'attributes';

export interface CompletenessField {
  key: CompletenessFieldKey;
  label: string;
  filled: boolean;
  /** Whether this field counts toward the server-aligned percent. */
  scored: boolean;
  /** DOM anchor on the detail page; the widget scrolls + focuses here. */
  anchor: string;
}

export interface ProductCompleteness {
  /** Filled count over the SCORED fields only (matches the server). */
  filled: number;
  /** Number of scored fields (always 6, server-aligned). */
  total: number;
  /** Server-aligned percent: round(filledScored / totalScored * 100). */
  percent: number;
  /** Every field considered (scored + optional attributes). */
  fields: CompletenessField[];
  /** Fields not yet filled (scored and optional). */
  missing: CompletenessField[];
}

// The six server-scored fields (order matters for the "missing" list UI).
export const SCORED_FIELD_KEYS: CompletenessFieldKey[] = [
  'name',
  'category',
  'description',
  'images',
  'keywords',
  'manufacturer',
];

export const COMPLETENESS_LABELS: Record<CompletenessFieldKey, string> = {
  name: 'Назва',
  category: 'Категорія',
  description: 'Опис',
  images: 'Зображення',
  keywords: 'Ключові слова',
  manufacturer: 'Виробник',
  attributes: 'Атрибути',
};

/** Anchor IDs used by the detail page; helper centralises the contract. */
export const COMPLETENESS_ANCHORS: Record<CompletenessFieldKey, string> = {
  name: 'field-name',
  category: 'field-category',
  description: 'field-description',
  images: 'field-images',
  keywords: 'field-keywords',
  manufacturer: 'field-manufacturer',
  attributes: 'field-attributes',
};

function isHtmlEmpty(html: string | null | undefined): boolean {
  if (!html) return true;
  return !html.replace(/<[^>]*>/g, '').trim();
}

function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Shape the checker reads — a subset of the taranka Product. */
export interface ProductLike {
  name?: string | null;
  categoryId?: string | null;
  description?: string | null;
  images?: string[] | null;
  searchKeywords?: string[] | null;
  manufacturer?: string | null;
}

export interface ComputeOptions {
  /** Category attribute definitions; required to count the "attributes" slot. */
  categoryAttributes?: Array<{ id: string }> | null;
  /** The product's filled attribute-value junction rows. */
  productAttributeValues?: Array<{ attributeId: string }> | null;
  /** Override: number of attributes the category requires (table cell path). */
  attributesNeeded?: number | null;
  /** Override: number of attributes already filled (table cell path). */
  attributesFilled?: number | null;
  /** Force-skip the (non-scored) attribute slot even if data is present. */
  includeAttributes?: boolean;
}

export function computeProductCompleteness(
  product: ProductLike,
  options: ComputeOptions = {},
): ProductCompleteness {
  const fields: CompletenessField[] = [];

  const push = (key: CompletenessFieldKey, filled: boolean, scored: boolean) => {
    fields.push({
      key,
      label: COMPLETENESS_LABELS[key],
      filled,
      scored,
      anchor: COMPLETENESS_ANCHORS[key],
    });
  };

  // ----- Six server-scored fields -----
  push('name', isNonEmptyString(product.name), true);
  push('category', isNonEmptyString(product.categoryId), true);
  push('description', !isHtmlEmpty(product.description), true);
  push('images', Array.isArray(product.images) && product.images.length > 0, true);
  push(
    'keywords',
    Array.isArray(product.searchKeywords) && product.searchKeywords.length > 0,
    true,
  );
  push('manufacturer', isNonEmptyString(product.manufacturer), true);

  // ----- Optional (non-scored) attribute slot, detail page only -----
  const hasArrays =
    options.categoryAttributes != null || options.productAttributeValues != null;
  const hasCounts = typeof options.attributesNeeded === 'number';
  const attrsRequested =
    options.includeAttributes !== false && (hasArrays || hasCounts);

  if (attrsRequested && hasCounts) {
    const needed = options.attributesNeeded ?? 0;
    const filled = options.attributesFilled ?? 0;
    if (needed > 0) push('attributes', filled >= needed, false);
  } else if (
    attrsRequested &&
    Array.isArray(options.categoryAttributes) &&
    options.categoryAttributes.length > 0
  ) {
    const filledIds = new Set(
      (options.productAttributeValues ?? []).map((v) => v.attributeId),
    );
    const allFilled = options.categoryAttributes.every((a) => filledIds.has(a.id));
    push('attributes', allFilled, false);
  }

  // Percent is computed over the SCORED fields only (server-aligned).
  const scored = fields.filter((f) => f.scored);
  const filled = scored.filter((f) => f.filled).length;
  const total = scored.length;
  const percent = total === 0 ? 100 : Math.round((filled / total) * 100);
  const missing = fields.filter((f) => !f.filled);

  return { filled, total, percent, fields, missing };
}

/**
 * Coarse severity bucket for a percent, mirroring the server's stats buckets:
 * complete (100) · high (>=60) · medium (>=30) · low (>0) · empty (0).
 */
export type CompletenessBucket = 'complete' | 'high' | 'medium' | 'low' | 'empty';

export function completenessBucket(percent: number): CompletenessBucket {
  if (percent === 100) return 'complete';
  if (percent >= 60) return 'high';
  if (percent >= 30) return 'medium';
  if (percent > 0) return 'low';
  return 'empty';
}
