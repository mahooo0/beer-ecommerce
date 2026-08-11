import { TarankaHero } from '@/components/taranka/hero';
import { TarankaCategorySlider, type CategorySlide } from '@/components/taranka/category-slider';
import { TarankaPopularProducts } from '@/components/taranka/popular-products';
import { TarankaPromoBanner } from '@/components/taranka/promo-banner';
import { TarankaNewsSlider } from '@/components/taranka/news-slider';
import { TarankaAbout } from '@/components/taranka/about';
import { TarankaFooter } from '@/components/taranka/footer';
import { api } from '@/lib/api';
import { toCatalogProducts } from '@/lib/product-mapper';
import type { CatalogProduct } from '@/components/taranka/catalog-card';
import { getLatestPostsSafe, postImageURL, formatBlogDate } from '@/lib/blog-api';
import type { NewsSlide } from '@/components/taranka/news-slider';

// Always fetch fresh catalog data on the server.
export const dynamic = 'force-dynamic';

async function getCategorySlides(): Promise<CategorySlide[]> {
  try {
    const result = await api.categories.getAll();
    const all = result.data || [];
    return all
      .filter((c) => !c.parentId)
      .sort((a, b) => a.position - b.position)
      .slice(0, 8)
      .map((c) => ({
        label: c.name,
        image: c.image || '',
        href: `/products?category=${encodeURIComponent(c.slug)}`,
      }));
  } catch {
    return [];
  }
}

async function getPopularProducts(): Promise<CatalogProduct[]> {
  try {
    const result = await api.products.getAll({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' });
    return toCatalogProducts(result.data);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [categories, popular, posts] = await Promise.all([
    getCategorySlides(),
    getPopularProducts(),
    getLatestPostsSafe('pl', 8),
  ]);

  // Feed the existing news slider with the latest blog posts (pl). Falls back to
  // the slider's built-in placeholders when the CMS has no posts / is unreachable.
  const newsItems: NewsSlide[] = posts.map((p) => ({
    image: postImageURL(p) || '/news/image0.jpg',
    date: formatBlogDate(p.publishedAt),
    title: p.title || '',
    href: `/pl/blog/${p.slug}`,
    meta: p.categories?.[0]?.title || undefined,
  }));

  return (
    <div>
      <TarankaHero />
      <TarankaCategorySlider categories={categories} />
      <TarankaPopularProducts products={popular} />
      <TarankaPromoBanner />
      <TarankaNewsSlider items={newsItems} />
      <TarankaAbout />
      <TarankaFooter />
    </div>
  );
}
