import React from 'react';
import Link from 'next/link';
import { internalDocToHref, type BlogLocale, type MediaDoc } from '@/lib/blog-api';

/**
 * Lexical (Payload richText) → React renderer for the storefront blog.
 * Handles the standard node set plus the custom blocks enabled on `posts.content`
 * (Banner / Code / MediaBlock), inline `upload` and `relationship` nodes, and
 * internal links (resolved to storefront URLs). Unknown nodes degrade to their
 * children so new node types never blank out.
 */

type Node = any;

const FORMAT = { bold: 1, italic: 2, strikethrough: 4, underline: 8, code: 16 } as const;

function renderText(node: Node, key: React.Key): React.ReactNode {
  let el: React.ReactNode = node.text ?? '';
  const f: number = node.format || 0;
  if (f & FORMAT.code) el = <code className="rounded bg-black/5 px-1 py-0.5 text-[0.9em]">{el}</code>;
  if (f & FORMAT.bold) el = <strong>{el}</strong>;
  if (f & FORMAT.italic) el = <em>{el}</em>;
  if (f & FORMAT.underline) el = <u>{el}</u>;
  if (f & FORMAT.strikethrough) el = <s>{el}</s>;
  return <React.Fragment key={key}>{el}</React.Fragment>;
}

function renderChildren(node: Node, lang: BlogLocale): React.ReactNode {
  if (!Array.isArray(node?.children)) return null;
  return node.children.map((child: Node, i: number) => renderNode(child, i, lang));
}

// ---------- custom blocks ----------

const BANNER_STYLES: Record<string, string> = {
  info: 'border-blue-300 bg-blue-50 text-blue-900',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
  error: 'border-red-300 bg-red-50 text-red-900',
  success: 'border-green-300 bg-green-50 text-green-900',
};

function BannerBlock({ style, content, lang }: { style?: string; content?: unknown; lang: BlogLocale }) {
  const cls = BANNER_STYLES[style || 'info'] || BANNER_STYLES.info;
  const root = (content as { root?: Node } | null)?.root;
  return (
    <div className={`my-6 rounded-2xl border px-5 py-4 text-[16px] leading-relaxed [&>*:last-child]:mb-0 ${cls}`}>
      {root ? renderChildren(root, lang) : null}
    </div>
  );
}

function CodeBlock({ language, code }: { language?: string; code?: string }) {
  if (!code) return null;
  return (
    <div className="my-6 overflow-hidden rounded-2xl bg-[#1e1b18]">
      {language ? (
        <div className="border-b border-white/10 px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white/50">
          {language}
        </div>
      ) : null}
      <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-relaxed text-[#f4ede6]">
        <code className={language ? `language-${language}` : undefined}>{code}</code>
      </pre>
    </div>
  );
}

function mediaSrc(media: MediaDoc): string | undefined {
  return media.sizes?.large?.url || media.sizes?.xlarge?.url || media.url || undefined;
}

function MediaFigure({ media, lang }: { media?: MediaDoc | number | string | null; lang: BlogLocale }) {
  if (!media || typeof media !== 'object') return null;
  const src = mediaSrc(media);
  if (!src) return null;
  const caption = (media.caption as { root?: Node } | null)?.root;
  return (
    <figure className="my-8">
      <div className="overflow-hidden rounded-[20px] bg-black/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={media.alt || ''}
          width={media.width || undefined}
          height={media.height || undefined}
          loading="lazy"
          className="h-auto w-full object-cover"
        />
      </div>
      {caption ? (
        <figcaption className="mt-2 text-center text-[14px] text-[#6b5750]">{renderChildren(caption, lang)}</figcaption>
      ) : null}
    </figure>
  );
}

function linkHref(node: Node, lang: BlogLocale): { href: string; internal: boolean; newTab: boolean } {
  const fields = node.fields || {};
  const newTab = Boolean(fields.newTab);
  if (fields.linkType === 'internal' && fields.doc && typeof fields.doc.value === 'object') {
    const relationTo = fields.doc.relationTo || node.relationTo;
    const slug = fields.doc.value?.slug;
    return { href: internalDocToHref(relationTo, slug, lang), internal: true, newTab };
  }
  return { href: fields.url || node.url || '#', internal: false, newTab };
}

// ---------- node dispatch ----------

function renderNode(node: Node, key: React.Key, lang: BlogLocale): React.ReactNode {
  if (!node) return null;
  switch (node.type) {
    case 'text':
      return renderText(node, key);
    case 'linebreak':
      return <br key={key} />;
    case 'tab':
      return <span key={key}>{'\t'}</span>;
    case 'horizontalrule':
      return <hr key={key} className="my-8 border-black/10" />;
    case 'paragraph':
      return (
        <p key={key} className="mb-5 leading-relaxed">
          {renderChildren(node, lang)}
        </p>
      );
    case 'heading': {
      const Tag = (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tag) ? node.tag : 'h2') as keyof React.JSX.IntrinsicElements;
      const size =
        node.tag === 'h1'
          ? 'text-[34px]'
          : node.tag === 'h2'
            ? 'text-[28px]'
            : node.tag === 'h3'
              ? 'text-[22px]'
              : 'text-[19px]';
      return (
        <Tag key={key} className={`mb-4 mt-8 font-taranka-display font-extrabold uppercase leading-tight text-ink-900 ${size}`}>
          {renderChildren(node, lang)}
        </Tag>
      );
    }
    case 'quote':
      return (
        <blockquote key={key} className="my-6 border-l-4 border-brand-red-500 pl-5 italic text-[#443029]">
          {renderChildren(node, lang)}
        </blockquote>
      );
    case 'list': {
      const Tag = (node.tag === 'ol' || node.listType === 'number' ? 'ol' : 'ul') as 'ol' | 'ul';
      return (
        <Tag key={key} className={`mb-5 ml-6 space-y-2 ${Tag === 'ol' ? 'list-decimal' : 'list-disc'}`}>
          {renderChildren(node, lang)}
        </Tag>
      );
    }
    case 'listitem':
      return <li key={key}>{renderChildren(node, lang)}</li>;
    case 'link':
    case 'autolink': {
      const { href, internal, newTab } = linkHref(node, lang);
      const cls = 'font-medium text-brand-red-500 underline underline-offset-2';
      if (internal && !newTab) {
        return (
          <Link key={key} href={href} className={cls}>
            {renderChildren(node, lang)}
          </Link>
        );
      }
      return (
        <a
          key={key}
          href={href}
          {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className={cls}
        >
          {renderChildren(node, lang)}
        </a>
      );
    }
    case 'upload':
      // Inline image node (relationTo 'media'); value is the populated media doc.
      return <MediaFigure key={key} media={node.value} lang={lang} />;
    case 'relationship': {
      const value = node.value;
      if (!value || typeof value !== 'object') return null;
      const href = internalDocToHref(node.relationTo, value.slug, lang);
      return (
        <Link key={key} href={href} className="font-medium text-brand-red-500 underline underline-offset-2">
          {value.title || value.slug || href}
        </Link>
      );
    }
    case 'block': {
      const f = node.fields || {};
      switch (f.blockType) {
        case 'banner':
          return <BannerBlock key={key} style={f.style} content={f.content} lang={lang} />;
        case 'code':
          return <CodeBlock key={key} language={f.language} code={f.code} />;
        case 'mediaBlock':
          return <MediaFigure key={key} media={f.media} lang={lang} />;
        default:
          return null;
      }
    }
    default:
      return node.children ? <React.Fragment key={key}>{renderChildren(node, lang)}</React.Fragment> : null;
  }
}

export function RichText({ data, lang, className = '' }: { data: unknown; lang: BlogLocale; className?: string }) {
  const root = (data as { root?: Node } | null)?.root;
  if (!root) return null;
  return <div className={`font-taranka-body text-[17px] text-[#2b1d18] ${className}`}>{renderChildren(root, lang)}</div>;
}
