import React from 'react';

/**
 * Minimal Lexical (Payload richText) → React renderer.
 * Handles the standard node set produced by the blog's editor. Custom blocks
 * (Banner/Code/MediaBlock) are intentionally skipped in the storefront.
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

function renderChildren(node: Node): React.ReactNode {
  if (!Array.isArray(node?.children)) return null;
  return node.children.map((child: Node, i: number) => renderNode(child, i));
}

function renderNode(node: Node, key: React.Key): React.ReactNode {
  if (!node) return null;
  switch (node.type) {
    case 'text':
      return renderText(node, key);
    case 'linebreak':
      return <br key={key} />;
    case 'horizontalrule':
      return <hr key={key} className="my-8 border-black/10" />;
    case 'paragraph':
      return (
        <p key={key} className="mb-5 leading-relaxed">
          {renderChildren(node)}
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
          {renderChildren(node)}
        </Tag>
      );
    }
    case 'quote':
      return (
        <blockquote key={key} className="my-6 border-l-4 border-brand-red-500 pl-5 italic text-[#443029]">
          {renderChildren(node)}
        </blockquote>
      );
    case 'list': {
      const Tag = (node.tag === 'ol' || node.listType === 'number' ? 'ol' : 'ul') as 'ol' | 'ul';
      return (
        <Tag key={key} className={`mb-5 ml-6 space-y-2 ${Tag === 'ol' ? 'list-decimal' : 'list-disc'}`}>
          {renderChildren(node)}
        </Tag>
      );
    }
    case 'listitem':
      return <li key={key}>{renderChildren(node)}</li>;
    case 'link': {
      const url: string = node.fields?.url || node.url || '#';
      const newTab: boolean = Boolean(node.fields?.newTab);
      return (
        <a
          key={key}
          href={url}
          {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="font-medium text-brand-red-500 underline underline-offset-2"
        >
          {renderChildren(node)}
        </a>
      );
    }
    case 'block':
      // Custom Payload blocks are not rendered in the storefront.
      return null;
    default:
      return node.children ? <React.Fragment key={key}>{renderChildren(node)}</React.Fragment> : null;
  }
}

export function RichText({ data, className = '' }: { data: unknown; className?: string }) {
  const root = (data as { root?: Node } | null)?.root;
  if (!root) return null;
  return <div className={`font-taranka-body text-[17px] text-[#2b1d18] ${className}`}>{renderChildren(root)}</div>;
}
