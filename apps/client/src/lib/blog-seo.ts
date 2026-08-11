/** Shared SEO constants + JSON-LD builders for the storefront (blog + sitewide). */

export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.taranka.online').replace(/\/$/, '');
export const SITE_NAME = 'Taranka';
export const ORG_LOGO = `${SITE}/taranka-logo.svg`;
/** Branded fallback social image when a post has no meta/hero image. */
export const FALLBACK_OG = `${SITE}/hero-beer.png`;

/**
 * Only the production host should be indexable. DEV/staging (dev.taranka.online)
 * and any other host stay `noindex` so preview environments never rank.
 */
export const IS_PROD_HOST = SITE === 'https://taranka.online';

/** Robots directive for indexable content, gated on the prod host. */
export const INDEXABLE = IS_PROD_HOST
  ? { index: true, follow: true }
  : { index: false, follow: false };

export function pageTitle(s: string): string {
  return `${s} | ${SITE_NAME}`;
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE,
    logo: { '@type': 'ImageObject', url: ORG_LOGO },
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE}/pl/blog?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/**
 * Serialize a JSON-LD object for a <script type="application/ld+json"> tag.
 * Escapes `<`, `>` and `&` so CMS-authored free text (titles etc.) containing
 * `</script>` can't break out of the script element (JSON-LD injection / XSS).
 */
export function jsonLdScript(obj: unknown): { __html: string } {
  const json = JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
  return { __html: json };
}
