import type { Metadata } from "next";
import { TarankaProductDetail } from "@/components/taranka/product-detail";
import { TarankaProductDescription } from "@/components/taranka/product-description";
import { TarankaProductRow } from "@/components/taranka/product-row";
import type { CatalogProduct } from "@/components/taranka/catalog-card";
import { TarankaAbout } from "@/components/taranka/about";
import { TarankaFooter } from "@/components/taranka/footer";

export const metadata: Metadata = {
  title: "Chrupki kukurydziane słodkie o smaku mleka | Taranka",
  description: "Chrupki kukurydziane słodkie o smaku mleka, 140 g",
};

const dummyProducts: CatalogProduct[] = Array.from({ length: 8 }, (_, i) => ({
  id: i + 100,
  name: "Chrupki kukurydziane słodkie o smaku mleka",
  weight: "140g",
  oldPrice: "6.45zł",
  newPrice: "6.45zł",
  image: "/categories/product-chrupki.png",
}));

export default function ProductPage() {
  return (
    <>
      <div className="mx-auto max-w-[1440px] px-[120px] py-8 font-taranka-body">
        <TarankaProductDetail />

        <div className="mt-16">
          <TarankaProductDescription />
        </div>

        <div className="mt-20">
          <TarankaProductRow title="Ostatnio oglądane" products={dummyProducts} />
        </div>

        <div className="mt-20">
          <TarankaProductRow title="Zalecamy zapoznanie się z" products={dummyProducts} />
        </div>
      </div>
      <TarankaAbout />
      <TarankaFooter />
    </>
  );
}
