import { TarankaHero } from '@/components/taranka/hero';
import { TarankaCategorySlider } from '@/components/taranka/category-slider';
import { TarankaPopularProducts } from '@/components/taranka/popular-products';
import { TarankaPromoBanner } from '@/components/taranka/promo-banner';
import { TarankaNewsSlider } from '@/components/taranka/news-slider';
import { TarankaAbout } from '@/components/taranka/about';
import { TarankaFooter } from '@/components/taranka/footer';

export default function HomePage() {
  return (
    <div>
      <TarankaHero />
      <TarankaCategorySlider />
      <TarankaPopularProducts />
      <TarankaPromoBanner />
      <TarankaNewsSlider />
      <TarankaAbout />
      <TarankaFooter />
    </div>
  );
}
