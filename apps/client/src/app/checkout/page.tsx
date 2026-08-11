import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/taranka/checkout-flow";
import { TarankaAbout } from "@/components/taranka/about";
import { TarankaFooter } from "@/components/taranka/footer";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT("checkout");
  return {
    title: t("meta.checkoutTitle"),
  };
}

export default function CheckoutPage() {
  return (
    <>
      <div className="mx-auto max-w-[1440px] px-[120px] py-8 font-taranka-body">
        <CheckoutFlow />
      </div>
      <TarankaAbout />
      <TarankaFooter />
    </>
  );
}
