import type { Metadata } from "next";
import { TarankaCartPage } from "@/components/taranka/cart-page";
import { TarankaAbout } from "@/components/taranka/about";
import { TarankaFooter } from "@/components/taranka/footer";

export const metadata: Metadata = {
  title: "Koszyk | Taranka",
};

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
