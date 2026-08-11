import React from 'react';
import Link from 'next/link';
import { RichText } from '@/components/taranka/rich-text';
import { CmsForm as CmsFormRenderer } from '@/components/taranka/cms-form';
import { internalDocToHref, type BlogLocale, type MediaDoc } from '@/lib/blog-api';
import type {
  PageBlock,
  ContentBlock,
  CtaBlock,
  MediaBlockType,
  FormBlockType,
  ContentColumn,
  CmsForm,
} from '@/lib/pages-api';

/**
 * Server renderer for the Payload `pages.layout` blocks used by the storefront
 * content pages: `content` (richText columns), `cta`, `mediaBlock`, `formBlock`.
 * Unknown block types are skipped so new CMS blocks never break the page.
 */

const CMS_URL = (process.env.NEXT_PUBLIC_CMS_URL || 'https://cms.dev.taranka.online').replace(/\/$/, '');

const COL_SPAN: Record<string, string> = {
  oneThird: 'md:col-span-4',
  half: 'md:col-span-6',
  twoThirds: 'md:col-span-8',
  full: 'md:col-span-12',
};

function linkHref(link: ContentColumn['link'], lang: BlogLocale): { href: string; newTab: boolean } {
  if (!link) return { href: '#', newTab: false };
  const newTab = Boolean(link.newTab);
  if (link.type === 'reference' && link.reference?.value && typeof link.reference.value === 'object') {
    return { href: internalDocToHref(link.reference.relationTo, link.reference.value.slug, lang), newTab };
  }
  return { href: link.url || '#', newTab };
}

function CmsLink({ link, lang }: { link: ContentColumn['link']; lang: BlogLocale }) {
  if (!link?.label) return null;
  const { href, newTab } = linkHref(link, lang);
  const outline = link.appearance === 'outline';
  const cls = outline
    ? 'inline-flex items-center justify-center rounded-full border-2 border-brand-red-500 px-7 py-3 font-taranka-display text-[14px] font-extrabold uppercase tracking-wide text-brand-red-500 transition-colors hover:bg-brand-red-500 hover:text-white'
    : 'inline-flex items-center justify-center rounded-full bg-brand-red-500 px-7 py-3 font-taranka-display text-[14px] font-extrabold uppercase tracking-wide text-white transition-opacity hover:opacity-90';
  return (
    <Link href={href} {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={cls}>
      {link.label}
    </Link>
  );
}

function mediaSrc(media: MediaDoc): string | undefined {
  const rel = media.sizes?.xlarge?.url || media.sizes?.large?.url || media.url || undefined;
  if (!rel) return undefined;
  return rel.startsWith('http') ? rel : `${CMS_URL}${rel}`;
}

function CmsImage({ media }: { media?: MediaDoc | number | string | null }) {
  if (!media || typeof media !== 'object') return null;
  const src = mediaSrc(media);
  if (!src) return null;
  return (
    <figure className="my-8 overflow-hidden rounded-[20px] bg-black/5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={media.alt || ''}
        width={media.width || undefined}
        height={media.height || undefined}
        loading="lazy"
        className="h-auto w-full object-cover"
      />
    </figure>
  );
}

function ContentBlockView({ block, lang }: { block: ContentBlock; lang: BlogLocale }) {
  const columns = block.columns ?? [];
  if (!columns.length) return null;
  return (
    <div className="my-8 grid grid-cols-1 gap-8 md:grid-cols-12">
      {columns.map((col, i) => (
        <div key={i} className={COL_SPAN[col.size || 'full'] || 'md:col-span-12'}>
          {col.richText ? <RichText data={col.richText} lang={lang} /> : null}
          {col.enableLink && col.link ? (
            <div className="mt-5">
              <CmsLink link={col.link} lang={lang} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function CtaBlockView({ block, lang }: { block: CtaBlock; lang: BlogLocale }) {
  return (
    <div className="my-10 flex flex-col items-start gap-6 rounded-[24px] bg-cream-50 px-8 py-10 md:flex-row md:items-center md:justify-between">
      <div className="max-w-2xl">{block.richText ? <RichText data={block.richText} lang={lang} /> : null}</div>
      <div className="flex flex-wrap gap-3">
        {(block.links ?? []).map((l, i) => (
          <CmsLink key={i} link={l?.link} lang={lang} />
        ))}
      </div>
    </div>
  );
}

function FormBlockView({ block, lang }: { block: FormBlockType; lang: BlogLocale }) {
  const form = block.form;
  if (!form || typeof form !== 'object') return null;
  return (
    <div className="my-10 rounded-[24px] border border-black/5 bg-white p-6 shadow-sm md:p-8">
      {block.enableIntro && block.introContent ? (
        <div className="mb-6">
          <RichText data={block.introContent} lang={lang} />
        </div>
      ) : null}
      <CmsFormRenderer form={form as CmsForm} lang={lang} />
    </div>
  );
}

export function RenderBlocks({ blocks, lang }: { blocks?: PageBlock[] | null; lang: BlogLocale }) {
  if (!blocks?.length) return null;
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.blockType) {
          case 'content':
            return <ContentBlockView key={block.id ?? i} block={block as ContentBlock} lang={lang} />;
          case 'cta':
            return <CtaBlockView key={block.id ?? i} block={block as CtaBlock} lang={lang} />;
          case 'mediaBlock':
            return <CmsImage key={block.id ?? i} media={(block as MediaBlockType).media} />;
          case 'formBlock':
            return <FormBlockView key={block.id ?? i} block={block as FormBlockType} lang={lang} />;
          default:
            return null;
        }
      })}
    </>
  );
}
