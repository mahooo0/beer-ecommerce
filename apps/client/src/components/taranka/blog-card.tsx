import Link from 'next/link';
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
  const category = post.categories?.[0];

  return (
    <article className="group flex flex-col">
      <Link href={href} className="block h-[220px] w-full overflow-hidden rounded-[20px] bg-black/5">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={post.heroImage?.alt || post.title || ''}
            width={post.heroImage?.width || undefined}
            height={post.heroImage?.height || undefined}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : null}
      </Link>

      <div className="mt-5 flex items-center gap-3 text-xs text-[#443029]">
        {post.publishedAt ? <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time> : null}
        {category?.title ? (
          category.slug ? (
            <Link
              href={`/${lang}/blog/category/${category.slug}`}
              className="rounded-full bg-black/5 px-2.5 py-0.5 transition-colors hover:bg-brand-red-500 hover:text-white"
            >
              {category.title}
            </Link>
          ) : (
            <span className="rounded-full bg-black/5 px-2.5 py-0.5">{category.title}</span>
          )
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
