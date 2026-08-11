// Lightweight client-side slugify with Cyrillic (RU/UA) transliteration.
// Used for live slug previews in forms. The backend re-generates the real,
// collision-checked slug on save (via the `slugify` package), so this only
// needs to produce a matching human-readable preview.

const CYRILLIC_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ё: 'e',
  ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh',
  ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e',
  ю: 'iu', я: 'ia',
};

/** Transliterate Cyrillic → Latin (leaves Latin/other characters as-is). */
export function transliterate(input: string): string {
  let out = '';
  for (const ch of input) {
    const lower = ch.toLowerCase();
    const mapped = CYRILLIC_MAP[lower];
    if (mapped !== undefined) {
      // Preserve capitalization of the first letter of a multi-char mapping.
      out += ch === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1);
    } else {
      out += ch;
    }
  }
  return out;
}

/** Produce a URL slug: transliterate, lowercase, strip non-alphanumerics. */
export function slugify(input: string): string {
  return transliterate(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
