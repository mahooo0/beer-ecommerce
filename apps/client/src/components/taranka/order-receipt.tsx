"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Order } from "@repo/types";
import { api } from "@/lib/api";
import { formatZl, PRODUCT_IMAGE_FALLBACK } from "@/lib/product-mapper";

/**
 * Confirmation receipt shown on the success page. Fetches the just-placed order
 * by id and renders the same money breakdown the customer will see in their
 * order history and the admin sees in the dashboard — including the loyalty /
 * personal discount that was applied. Orders are public-readable by their
 * unguessable id, so no auth is needed here.
 */
export function OrderReceipt({ orderId }: { orderId: string }) {
  const { t } = useTranslation("checkout");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.orders.getById(orderId);
        if (!cancelled && res.success && res.data) setOrder(res.data);
      } catch {
        /* leave order null — the page still shows the thank-you message */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return <div className="mx-auto mt-6 h-40 max-w-[420px] animate-pulse rounded-2xl bg-cream-100" />;
  }
  if (!order) return null;

  const discountAmount = order.discountAmount ?? 0;
  const discountPercent =
    order.subtotal > 0 ? Math.round((discountAmount / order.subtotal) * 100) : 0;

  return (
    <div className="mx-auto mt-8 max-w-[440px] rounded-2xl bg-cream-100 p-6 text-left">
      <div className="flex items-baseline justify-between">
        <p className="font-taranka-display text-sm font-bold uppercase tracking-wide text-ink-900">
          {t("receipt.heading")}
        </p>
        <p className="font-mono text-xs text-[#6b5f57]">{order.orderNumber}</p>
      </div>

      <ul className="mt-4 space-y-3">
        {order.items.map((it, idx) => (
          <li key={idx} className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={it.imageUrl || PRODUCT_IMAGE_FALLBACK}
              alt={it.name}
              className="size-9 shrink-0 object-contain"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink-900">{it.name}</p>
              <p className="text-xs text-[#9E9B90]">
                {it.quantity} × {formatZl(it.price)}
              </p>
            </div>
            <span className="whitespace-nowrap text-sm font-semibold text-ink-900 tabular-nums">
              {formatZl(it.price * it.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-2 border-t border-cream-300 pt-4 text-sm">
        <Row label={t("summary.subtotal")} value={formatZl(order.subtotal)} />
        {discountAmount > 0 && (
          <Row
            label={`${t("summary.discount")}${discountPercent > 0 ? ` (${discountPercent}%)` : ""}`}
            value={`−${formatZl(discountAmount)}`}
            tone="save"
          />
        )}
        {order.shippingCost > 0 && (
          <Row label={t("summary.shipping")} value={formatZl(order.shippingCost)} />
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between border-t border-cream-300 pt-3 text-base font-bold text-ink-900">
        <span>{t("summary.total")}</span>
        <span className="tabular-nums">{formatZl(order.totalAmount)}</span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "save";
}) {
  const color = tone === "save" ? "text-[#188E55]" : "text-ink-900";
  return (
    <div className={`flex items-baseline justify-between ${color}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
