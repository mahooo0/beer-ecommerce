"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, TrendingDown, Tag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCart } from "@/lib/cart-store";
import { formatZl } from "@/lib/product-mapper";
import { useCartQuote } from "@/lib/use-cart-quote";
import { wholesaleLineInfo, wholesaleCartSavingsCents } from "@/lib/wholesale";

export function TarankaCartPage() {
  const { t } = useTranslation("cart");
  const items = useCart((s) => s.items);
  const isWholesale = useCart((s) => s.isWholesale);
  const updateQty = useCart((s) => s.updateQty);
  const removeItem = useCart((s) => s.removeItem);

  // Effective goods total, in cents (each line's unit price is already tier-resolved
  // by the cart store). Server quote drives the loyalty discount; wholesale tier
  // savings are computed locally so they update instantly as quantities change.
  const subtotalCents = items.reduce((s, it) => s + Math.round(it.newPrice * 100) * it.qty, 0);
  const wholesaleSavingsCents = wholesaleCartSavingsCents(items, isWholesale);

  const quote = useCartQuote(items.map((it) => ({ productId: it.id, quantity: it.qty })));
  const discountCents = quote?.discountAmount ?? 0;
  const discountPercent = quote?.discountPercent ?? 0;
  const totalCents = Math.max(0, subtotalCents - discountCents);

  return (
    <div className="font-taranka-body">
      <h1 className="font-taranka-display text-2xl font-extrabold uppercase tracking-wide text-ink-900">
        {t("cartPage.title")}
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_383px]">
        <div className="rounded-[20px] bg-white p-6">
          {items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-base text-[#9E9B90]">{t("cartPage.empty")}</p>
              <Link
                href="/products"
                className="mt-4 inline-flex h-12 items-center rounded-full bg-brand-red-500 px-6 text-base font-medium text-cream-50 transition-colors hover:bg-brand-red-700"
              >
                {t("cartPage.goToCatalog")}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-cream-200">
              {items.map((item) => {
                const info = wholesaleLineInfo(item, isWholesale);
                const lineCents = Math.round(item.newPrice * 100) * item.qty;
                return (
                  <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="grid grid-cols-[60px_1fr_94px_auto_auto_auto] items-center gap-4 sm:gap-6">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-[60px] w-[60px] object-contain"
                      />

                      <div className="min-w-0">
                        <p className="text-sm leading-tight text-ink-900">{item.name}</p>
                        {item.weight && <p className="mt-1 text-sm text-ink-900">{item.weight}</p>}
                      </div>

                      <div className="inline-flex h-[30px] w-[94px] items-center justify-between rounded-full border border-[#9E9B90] px-2">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, -1)}
                          aria-label={t("cartPage.decrease")}
                          className="text-ink-900 transition-colors hover:text-brand-red-500"
                        >
                          <Minus className="size-3.5" strokeWidth={1.75} />
                        </button>
                        <span className="text-sm font-medium text-ink-900 tabular-nums">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          aria-label={t("cartPage.increase")}
                          className="text-ink-900 transition-colors hover:text-brand-red-500"
                        >
                          <Plus className="size-3.5" strokeWidth={1.75} />
                        </button>
                      </div>

                      <div className="flex items-baseline gap-3 whitespace-nowrap">
                        {info.showCrossed && (
                          <span className="text-sm font-bold text-[#9E9B90] line-through">
                            {formatZl(info.retailUnitCents)}
                          </span>
                        )}
                        <span className="text-sm font-bold text-ink-900">{formatZl(info.effUnitCents)}</span>
                      </div>

                      <p className="whitespace-nowrap text-base font-bold text-ink-900">{formatZl(lineCents)}</p>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label={t("cartPage.removeProduct")}
                        className="text-[#9E9B90] transition-colors hover:text-brand-red-500"
                      >
                        <Trash2 className="size-5" strokeWidth={1.5} />
                      </button>
                    </div>

                    {/* Wholesale savings + next-tier nudge (wholesale accounts only). */}
                    {(info.hasSaving || info.next) && (
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 pl-[76px] text-xs">
                        {info.hasSaving && (
                          <span className="inline-flex items-center gap-1 font-semibold text-[#188E55]">
                            <Tag className="size-3.5" strokeWidth={2} />
                            {t("cartPage.savePerLine", { amount: formatZl(info.savedCents) })}
                          </span>
                        )}
                        {info.next && (
                          <span className="inline-flex items-center gap-1 text-brand-red-500">
                            <TrendingDown className="size-3.5" strokeWidth={2} />
                            {t("cartPage.nextTier", {
                              qty: info.next.addQty,
                              price: formatZl(info.next.unitCents),
                            })}
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="h-fit rounded-[20px] bg-white p-6">
          <h2 className="font-taranka-display text-xl font-extrabold uppercase tracking-wide text-ink-900">
            {t("cartPage.orderAmount")}
          </h2>

          <div className="mt-5 space-y-3">
            <Row label={t("cartPage.subtotal")} value={formatZl(subtotalCents)} />
            {wholesaleSavingsCents > 0 && (
              <Row
                label={t("cartPage.wholesaleSavings")}
                value={`−${formatZl(wholesaleSavingsCents)}`}
                tone="save"
              />
            )}
            {discountCents > 0 && (
              <Row
                label={`${t("cartPage.loyaltyDiscount")}${discountPercent > 0 ? ` (${discountPercent}%)` : ""}`}
                value={`−${formatZl(discountCents)}`}
                tone="save"
              />
            )}
          </div>

          <div className="mt-6 border-t border-cream-200 pt-4">
            <Row label={t("cartPage.total")} value={formatZl(totalCents)} bold />
            <p className="mt-2 text-xs text-[#9E9B90]">{t("cartPage.shippingNote")}</p>
          </div>

          <Link
            href="/checkout"
            aria-disabled={items.length === 0}
            tabIndex={items.length === 0 ? -1 : 0}
            className={`mt-7 inline-flex h-12 w-full items-center justify-center rounded-full bg-brand-red-500 text-base font-medium text-cream-50 shadow-[0_0_0_0_rgba(170,60,55,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-700 hover:shadow-[0_8px_24px_-4px_rgba(170,60,55,0.5)] ${
              items.length === 0 ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {t("cartPage.placeOrder")}
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "save";
}) {
  return (
    <div
      className={`flex items-baseline justify-between ${
        bold ? "text-base font-bold" : "text-base font-semibold"
      } ${tone === "save" ? "text-[#188E55]" : "text-ink-900"}`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
