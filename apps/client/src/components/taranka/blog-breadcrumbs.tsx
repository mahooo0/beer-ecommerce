import Link from 'next/link';

export interface Crumb {
  name: string;
  href: string;
}

/** Visual breadcrumbs for blog pages (mirrors the BreadcrumbList JSON-LD). */
export function BlogBreadcrumbs({ items, label = 'breadcrumb' }: { items: Crumb[]; label?: string }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label={label} className="mb-6 text-[13px] text-[#6b5750]">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={it.href} className="flex items-center gap-1.5">
              {last ? (
                <span className="text-[#443029]" aria-current="page">
                  {it.name}
                </span>
              ) : (
                <Link href={it.href} className="transition-colors hover:text-brand-red-500">
                  {it.name}
                </Link>
              )}
              {!last ? <span className="text-black/30">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
