import type { Metadata } from "next";
import { getServerT } from "@/lib/i18n/server";
import { TarankaCartPage } from "@/components/taranka/cart-page";
import { TarankaAbout } from "@/components/taranka/about";
import { TarankaFooter } from "@/components/taranka/footer";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT("cart");
  return {
    title: `${t("page.metaTitle")} | Taranka`,
  };
}

export default function CartPage() {
  return (
    <>
      <div className="mx-auto max-w-[1440px] px-[120px] py-8 font-taranka-body">
        <TarankaCartPage />
      </div>
      <TarankaAbout />
      <TarankaFooter />
    </>
  );
}
