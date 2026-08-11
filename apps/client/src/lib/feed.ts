import { getPosts, postExcerpt, postOgImageURL, type BlogLocale, type BlogPost } from './blog-api';
import { lexicalToHtml } from './lexical-html';
import { SITE, SITE_NAME, ORG_LOGO } from './blog-seo';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cdata(s: string): string {
  return `<![CDATA[${s.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

async function fetchFeedPosts(lang: BlogLocale): Promise<BlogPost[]> {
  try {
    return (await getPosts({ locale: lang, limit: 20, depth: 2 })).docs;
  } catch {
    return [];
  }
}

function authorOf(p: BlogPost): string {
  const names = (p.populatedAuthors || []).map((a) => a?.name).filter(Boolean);
  return names.length ? names.join(', ') : SITE_NAME;
}

function feedTitle(lang: BlogLocale): string {
  return lang === 'uk' ? 'Taranka — Блог' : 'Taranka — Blog';
}

export async function buildRss(lang: BlogLocale): Promise<string> {
  const docs = await fetchFeedPosts(lang);
  const self = `${SITE}/${lang}/blog/rss.xml`;
  const now = new Date().toUTCString();
  const title = feedTitle(lang);

  const items = docs
    .map((p) => {
      const link = `${SITE}/${lang}/blog/${p.slug}`;
      const pub = p.publishedAt ? new Date(p.publishedAt).toUTCString() : '';
      const html = lexicalToHtml(p.content, lang);
      const og = postOgImageURL(p);
      const cats = (p.categories || [])
        .map((c) => c?.title)
        .filter(Boolean)
        .map((c) => `      <category>${esc(String(c))}</category>`)
        .join('\n');
      return `    <item>
      <title>${esc(p.title || '')}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(link)}</guid>
${pub ? `      <pubDate>${pub}</pubDate>\n` : ''}      <dc:creator>${esc(authorOf(p))}</dc:creator>
${cats ? cats + '\n' : ''}      <description>${esc(postExcerpt(p, 300))}</description>
      <content:encoded>${cdata(html)}</content:encoded>
${og ? `      <media:content url="${esc(og)}" medium="image" />\n      <enclosure url="${esc(og)}" type="image/jpeg" length="0" />\n` : ''}    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${esc(title)}</title>
    <link>${SITE}/${lang}/blog</link>
    <atom:link href="${self}" rel="self" type="application/rss+xml" />
    <description>${esc(title)}</description>
    <language>${lang}</language>
    <lastBuildDate>${now}</lastBuildDate>
    <copyright>© ${new Date().getUTCFullYear()} ${SITE_NAME}</copyright>
    <image>
      <url>${ORG_LOGO}</url>
      <title>${esc(title)}</title>
      <link>${SITE}/${lang}/blog</link>
    </image>
${items}
  </channel>
</rss>`;
}

export async function buildAtom(lang: BlogLocale): Promise<string> {
  const docs = await fetchFeedPosts(lang);
  const self = `${SITE}/${lang}/blog/atom.xml`;
  const title = feedTitle(lang);
  const updated = docs[0]?.updatedAt || docs[0]?.publishedAt || new Date().toISOString();

  const entries = docs
    .map((p) => {
      const link = `${SITE}/${lang}/blog/${p.slug}`;
      const html = lexicalToHtml(p.content, lang);
      const cats = (p.categories || [])
        .map((c) => c?.title)
        .filter(Boolean)
        .map((c) => `    <category term="${esc(String(c))}" />`)
        .join('\n');
      return `  <entry>
    <title>${esc(p.title || '')}</title>
    <link href="${esc(link)}" />
    <id>${esc(link)}</id>
    <updated>${p.updatedAt || p.publishedAt || new Date().toISOString()}</updated>
${p.publishedAt ? `    <published>${p.publishedAt}</published>\n` : ''}    <author><name>${esc(authorOf(p))}</name></author>
${cats ? cats + '\n' : ''}    <summary>${esc(postExcerpt(p, 300))}</summary>
    <content type="html">${cdata(html)}</content>
  </entry>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${esc(title)}</title>
  <link href="${SITE}/${lang}/blog" />
  <link href="${self}" rel="self" />
  <id>${SITE}/${lang}/blog</id>
  <updated>${updated}</updated>
  <author><name>${SITE_NAME}</name></author>
${entries}
</feed>`;
}
