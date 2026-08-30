import Link from "next/link";
import type { Metadata } from "next";
import { Check } from "lucide-react";
import { TarankaFooter } from "@/components/taranka/footer";
import { CheckoutSuccessClear } from "@/components/taranka/checkout-success-clear";
import { OrderReceipt } from "@/components/taranka/order-receipt";
import { getServerT } from "@/lib/i18n/server";

// Bank details for the "bank transfer" confirmation. Placeholder values — replace
// with the real recipient account (or make admin-configurable in a later phase).
const BANK_DETAILS = {
  account: "PL00 0000 0000 0000 0000 0000 0000",
  recipient: "Taranka Sp. z o.o.",
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT("checkout");
  return {
    title: t("meta.successTitle"),
  };
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ method?: string; orderId?: string }>;
}) {
  const t = await getServerT("checkout");
  const { method, orderId } = await searchParams;

  const isCod = method === "cod";
  const isTransfer = method === "bank_transfer";

  const title = isCod
    ? t("success.codTitle")
    : isTransfer
      ? t("success.transferTitle")
      : t("success.title");
  const message = isCod
    ? t("success.codMessage")
    : isTransfer
      ? t("success.transferMessage")
      : t("success.message");

  return (
    <>
      <CheckoutSuccessClear />
      <div className="mx-auto w-full max-w-[1280px] px-4 py-16 font-taranka-body sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[640px] rounded-[20px] bg-white p-12 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand-red-500 text-cream-50">
            <Check className="size-8" strokeWidth={2.5} />
          </div>
          <h1 className="mt-6 font-taranka-display text-2xl font-extrabold uppercase text-ink-900">
            {title}
          </h1>
          <p className="mt-3 text-base text-[#443029]">{message}</p>

          {orderId && <OrderReceipt orderId={orderId} />}

          {isTransfer && (
            <div className="mx-auto mt-6 max-w-[420px] rounded-2xl bg-cream-100 p-5 text-left text-sm text-ink-900">
              <p className="font-semibold">{t("success.transferDetailsHeading")}</p>
              <dl className="mt-3 space-y-2 text-[#443029]">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#9E9B90]">{t("success.transferRecipientLabel")}</dt>
                  <dd className="text-right">{BANK_DETAILS.recipient}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#9E9B90]">{t("success.transferAccountLabel")}</dt>
                  <dd className="text-right font-mono text-xs">{BANK_DETAILS.account}</dd>
                </div>
              </dl>
            </div>
          )}

          <Link
            href="/products"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-brand-red-500 px-9 text-base font-medium text-cream-50 transition-colors hover:bg-brand-red-700"
          >
            {t("success.backToCatalog")}
          </Link>
        </div>
      </div>
      <TarankaFooter />
    </>
  );
}
