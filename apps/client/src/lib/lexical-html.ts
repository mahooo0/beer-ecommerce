/**
 * Server-safe Lexical (Payload richText) → HTML string, for RSS `content:encoded`.
 * Kept separate from the React renderer (rich-text.tsx) which returns JSX.
 * Best-effort: covers the standard node set + custom blocks; unknown nodes render
 * their children.
 */
import { internalDocToHref, type BlogLocale } from './blog-api';
import { SITE } from './blog-seo';

type Node = any;

const FORMAT = { bold: 1, italic: 2, strikethrough: 4, underline: 8, code: 16 } as const;

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function text(node: Node): string {
  let s = esc(node.text ?? '');
  const f: number = node.format || 0;
  if (f & FORMAT.code) s = `<code>${s}</code>`;
  if (f & FORMAT.bold) s = `<strong>${s}</strong>`;
  if (f & FORMAT.italic) s = `<em>${s}</em>`;
  if (f & FORMAT.underline) s = `<u>${s}</u>`;
  if (f & FORMAT.strikethrough) s = `<s>${s}</s>`;
  return s;
}

function children(node: Node): string {
  if (!Array.isArray(node?.children)) return '';
  return node.children.map(nodeToHtml).join('');
}

function nodeToHtml(node: Node): string {
  if (!node) return '';
  switch (node.type) {
    case 'text':
      return text(node);
    case 'linebreak':
      return '<br/>';
    case 'horizontalrule':
      return '<hr/>';
    case 'paragraph':
      return `<p>${children(node)}</p>`;
    case 'heading': {
      const tag = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tag) ? node.tag : 'h2';
      return `<${tag}>${children(node)}</${tag}>`;
    }
    case 'quote':
      return `<blockquote>${children(node)}</blockquote>`;
    case 'list': {
      const tag = node.tag === 'ol' || node.listType === 'number' ? 'ol' : 'ul';
      return `<${tag}>${children(node)}</${tag}>`;
    }
    case 'listitem':
      return `<li>${children(node)}</li>`;
    case 'link':
    case 'autolink': {
      const f = node.fields || {};
      let url: string = f.url || node.url || '#';
      if (f.linkType === 'internal' && f.doc && typeof f.doc.value === 'object') {
        // Feeds have no base URL → emit absolute storefront links, matching the React renderer.
        url = SITE + internalDocToHref(f.doc.relationTo, f.doc.value?.slug, currentLang);
      } else if (typeof url === 'string' && url.startsWith('/')) {
        url = SITE + url;
      }
      return `<a href="${esc(String(url))}">${children(node)}</a>`;
    }
    case 'upload': {
      const v = node.value;
      const src = v?.url;
      return src ? `<p><img src="${esc(src)}" alt="${esc(v?.alt || '')}"/></p>` : '';
    }
    case 'block': {
      const f = node.fields || {};
      if (f.blockType === 'code') return `<pre><code>${esc(f.code || '')}</code></pre>`;
      if (f.blockType === 'mediaBlock' && f.media?.url) {
        return `<p><img src="${esc(f.media.url)}" alt="${esc(f.media.alt || '')}"/></p>`;
      }
      if (f.blockType === 'banner') {
        const root = f.content?.root;
        return root ? `<blockquote>${children(root)}</blockquote>` : '';
      }
      return '';
    }
    default:
      return node.children ? children(node) : '';
  }
}

// Set at each render entry; safe because rendering is fully synchronous.
let currentLang: BlogLocale = 'pl';

export function lexicalToHtml(data: unknown, lang: BlogLocale = 'pl'): string {
  currentLang = lang;
  const root = (data as { root?: Node } | null)?.root;
  if (!root) return '';
  return children(root);
}
