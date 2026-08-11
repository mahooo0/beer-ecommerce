import Link from 'next/link';
import { Eye } from 'lucide-react';
import { type BlogLocale, type BlogPost, postImageURL, postExcerpt, formatBlogDate } from '@/lib/blog-api';

/** Post preview card — mirrors the news-slider card styling, in a grid. */
export function TarankaBlogCard({
  post,
  lang,
  readMore,
}: {
  post: BlogPost;
  lang: BlogLocale;
  readMore: string;
}) {
  const img = postImageURL(post);
  const href = `/${lang}/blog/${post.slug}`;
  const category = post.categories?.[0]?.title;

  return (
    <article className="group flex flex-col">
      <Link href={href} className="block h-[220px] w-full overflow-hidden rounded-[20px] bg-black/5">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={post.heroImage?.alt || post.title || ''}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : null}
      </Link>

      <div className="mt-5 flex items-center gap-4 text-xs text-[#443029]">
        <span>{formatBlogDate(post.publishedAt)}</span>
        {category ? (
          <span className="inline-flex items-center gap-1">
            <Eye className="size-4" strokeWidth={1.75} />
            {category}
          </span>
        ) : null}
      </div>

      <h3 className="mt-2 text-[20px] font-semibold leading-tight text-[#443029] transition-colors group-hover:text-brand-red-500">
        <Link href={href}>{post.title}</Link>
      </h3>

      <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-[#6b5750]">{postExcerpt(post, 160)}</p>

      <Link
        href={href}
        className="mt-3 inline-block font-taranka-display text-sm font-extrabold uppercase tracking-wide text-brand-red-500 transition-transform duration-300 group-hover:translate-x-1"
      >
        {readMore}
      </Link>
    </article>
  );
}
