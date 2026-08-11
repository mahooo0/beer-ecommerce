/**
 * Client-side slug helpers for the catalog admin. Ported from 4fr-ecom's
 * apps/admin/src/lib/slug.ts and kept in sync with the backend's
 * apps/server/src/utils/slug.utils.ts. Used by the product/category/attribute
 * forms to live-transliterate what the admin types (Ukrainian / Russian /
 * mixed) into a URL-safe segment BEFORE it hits the server. The server
 * re-slugifies + collision-checks on save, so this only needs to produce a
 * matching human-readable preview.
 *
 * NOTE: taranka also has lib/slugify.ts (slugify + transliterate). This file is
 * the catalog-admin canonical helper and additionally exposes slugifyLive for
 * live-typing inputs. Prefer importing from '@/lib/slug' inside catalog forms.
 */

const CYR_TO_LAT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo',
  ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  і: 'i', ї: 'yi', є: 'ye', ґ: 'g',
};

/** Transliterate Cyrillic → Latin (leaves Latin / other characters as-is). */
export function transliterate(text: string): string {
  return text
    .split('')
    .map((c) => CYR_TO_LAT[c.toLowerCase()] ?? c)
    .join('');
}

/**
 * Turn arbitrary human-typed input into a slug: transliterate Cyrillic,
 * lower-case, collapse whitespace/underscores to dashes, drop everything else.
 * Result is either '' or matches /^[a-z0-9]+(?:-[a-z0-9]+)*$/.
 */
export function slugify(text: string): string {
  return transliterate(text)
    .toLowerCase()
    .trim()
    .replace(/\+/g, ' ') // '3+1' must read '3-1', not glue into '31'
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Live-typing variant: like slugify() but PRESERVES a trailing dash so the
 * admin can type 'acana-adult-' and keep going without the input snapping
 * shut. Also skips the leading-dash trim so a leading '-' survives one
 * keypress. Result may not be a 'clean' slug — the server re-slugifies on
 * submit as a safety net.
 */
export function slugifyLive(text: string): string {
  const trailingDash = /\s|-$/.test(text);
  const s = transliterate(text)
    .toLowerCase()
    .replace(/\+/g, ' ') // keep in sync with slugify()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
  return trailingDash && !s.endsWith('-') ? `${s}-` : s;
}

/**
 * Machine slug for an Attribute `name` (snake_case): transliterate + lower-case,
 * collapse to underscores, strip everything else. Mirrors the attribute service
 * which derives `name` from `displayName` when omitted.
 * e.g. 'Об'єм тари' → 'obiem_tary'.
 */
export function toMachineName(text: string): string {
  const base = transliterate(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return base || 'attribute';
}
