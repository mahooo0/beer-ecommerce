/**
 * URL-slug generator that transliterates Ukrainian/Cyrillic and Polish
 * diacritics to ASCII so PL/UK titles produce clean slugs (not dash-soup).
 */

const MAP: Record<string, string> = {
  // Ukrainian / Cyrillic
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh',
  з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', ъ: '', ы: 'y', э: 'e', ё: 'e',
  // Polish
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
};

export function slugify(input: string): string {
  return (input || '')
    .toLowerCase()
    .split('')
    .map((ch) => (ch in MAP ? MAP[ch] : ch))
    .join('')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip any remaining combining marks
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
