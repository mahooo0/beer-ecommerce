import Link from 'next/link';
import type { BlogLocale, RelatedPost } from '@/lib/blog-api';

/** "Читайте також / Czytaj także" — related posts as compact cards on the detail page. */
export function RelatedPosts({ posts, lang, title }: { posts: RelatedPost[]; lang: BlogLocale; title: string }) {
  const items = posts.filter((p) => p && typeof p === 'object' && p.slug);
  if (items.length === 0) return null;

  return (
    <section className="mt-16 border-t border-black/10 pt-10">
      <h2 className="font-taranka-display text-[26px] font-extrabold uppercase leading-none text-ink-900">{title}</h2>
      <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => {
          const href = `/${lang}/blog/${p.slug}`;
          const img = p.meta?.image?.url || undefined;
          const category = p.categories?.[0]?.title;
          return (
            <article key={p.id} className="group flex flex-col">
              <Link href={href} className="block h-[180px] w-full overflow-hidden rounded-[18px] bg-black/5">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt={p.meta?.image?.alt || p.title || ''}
                    width={p.meta?.image?.width || undefined}
                    height={p.meta?.image?.height || undefined}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : null}
              </Link>
              {category ? <span className="mt-4 text-xs text-[#6b5750]">{category}</span> : null}
              <h3 className="mt-1 text-[18px] font-semibold leading-tight text-[#443029] transition-colors group-hover:text-brand-red-500">
                <Link href={href}>{p.title}</Link>
              </h3>
              {p.meta?.description ? (
                <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-[#6b5750]">{p.meta.description}</p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
