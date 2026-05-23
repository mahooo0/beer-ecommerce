import type { Metadata } from "next";
import { CatalogSidebar } from "@/components/taranka/catalog-sidebar";
import { CatalogToolbar } from "@/components/taranka/catalog-toolbar";
import { CatalogCard, type CatalogProduct } from "@/components/taranka/catalog-card";
import { TarankaAbout } from "@/components/taranka/about";
import { TarankaFooter } from "@/components/taranka/footer";

export const metadata: Metadata = {
  title: "Katalog | Taranka",
  description: "Katalog produktów Taranka",
};

const products: CatalogProduct[] = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  name: "Chrupki kukurydziane słodkie o smaku mleka",
  weight: "140g",
  oldPrice: "6.45zł",
  newPrice: "6.45zł",
  image: "/categories/product-chrupki.png",
}));

export default function ProductsPage() {
  return (
    <>
      <div className="mx-auto max-w-[1440px] px-[120px] py-8 font-taranka-body">
        <div className="flex gap-6">
          <CatalogSidebar />

          <div className="flex-1">
            <CatalogToolbar shown={12} total={1345} />

            <div className="mt-9 grid grid-cols-3 gap-6">
              {products.map((p) => (
                <CatalogCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <TarankaAbout />
      <TarankaFooter />
    </>
  );
}
