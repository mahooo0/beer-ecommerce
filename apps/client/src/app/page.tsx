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
  const [categories, popular] = await Promise.all([getCategorySlides(), getPopularProducts()]);

  return (
    <div>
      <TarankaHero />
      <TarankaCategorySlider categories={categories} />
      <TarankaPopularProducts products={popular} />
      <TarankaPromoBanner />
      <TarankaNewsSlider />
      <TarankaAbout />
      <TarankaFooter />
    </div>
  );
}
