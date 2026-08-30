"use client";

import { useEffect, useState } from "react";
import { Info, FileDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth, useUser } from "@clerk/nextjs";
import type { Order, LoyaltyTier } from "@repo/types";
import { api } from "@/lib/api";
import { formatZl, PRODUCT_IMAGE_FALLBACK } from "@/lib/product-mapper";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/shadcn/accordion";
import { Separator } from "@/components/shadcn/separator";

const PAGE_SIZE = 10;

// Order statuses (lowercase, from the server) → i18n key under `orders.status`.
const STATUS_KEY: Record<string, string> = {
  pending: "pending",
  paid: "paid",
  processing: "processing",
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
  returned: "returned",
  refund_requested: "refundRequested",
};

function statusColor(status: string): string {
  if (["delivered", "paid", "shipped"].includes(status)) return "#188E55"; // green
  if (["cancelled", "returned", "refund_requested"].includes(status)) return "#AA3C37"; // red
  return "#C9A227"; // amber — pending / processing
}

function formatDate(value: string | Date): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

// Orders come back as lean Mongo docs, so the id lives on `_id`.
function orderId(order: Order): string {
  return (order as unknown as { _id?: string })._id ?? order.id;
}

export function ProfileOrders() {
  const { t } = useTranslation("profile");
  const { user } = useUser();
  const { getToken } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  // The customer's current loyalty tier %, resolved from lifetime paid spend vs.
  // the active tiers (same rule as the server / the "znizki" page). 0 → no badge.
  const [discountPercent, setDiscountPercent] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const token = (await getToken()) ?? undefined;
        const [spendRes, tiersRes] = await Promise.all([
          api.orders.getUserSpend(user.id, token),
          api.loyaltyTiers.getActive(),
        ]);
        if (cancelled) return;
        const spent = spendRes.success && spendRes.data ? spendRes.data.spentCents : 0;
        const tiers: LoyaltyTier[] = tiersRes.success && tiersRes.data ? tiersRes.data : [];
        const active = [...tiers]
          .sort((a, b) => b.minSpendCents - a.minSpendCents)
          .find((tier) => spent >= tier.minSpendCents);
        setDiscountPercent(active?.percent ?? 0);
      } catch {
        if (!cancelled) setDiscountPercent(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, getToken]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const token = (await getToken()) ?? undefined;
        const res = await api.orders.getByUser(user.id, { page, limit: PAGE_SIZE }, token);
        if (cancelled) return;
        if (res.success && res.data) {
          setOrders(res.data);
          setTotalPages(res.totalPages || 1);
        }
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, page, getToken]);

  return (
    <div className="flex-1 rounded-[20px] bg-white p-8 font-taranka-body">
      <div className="flex items-center justify-between gap-6">
        <h1 className="font-taranka-display text-2xl font-extrabold uppercase tracking-wide text-ink-900">
          {t("orders.title")}
        </h1>
        {discountPercent > 0 && (
          <div className="flex items-center gap-2 font-taranka-display text-base text-brand-red-500">
            <Info className="size-4" strokeWidth={1.75} />
            {t("orders.discountBadge", { percent: discountPercent })}
          </div>
        )}
      </div>

      {loading ? (
        <div className="mt-8 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[75px] animate-pulse rounded-xl bg-cream-100" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p className="mt-8 text-base text-[#9E9B90]">{t("orders.empty")}</p>
      ) : (
        <>
          <Accordion
            type="single"
            collapsible
            defaultValue={orders[0] ? orderId(orders[0]) : undefined}
            className="mt-8 space-y-3"
          >
            {orders.map((order) => (
              <OrderAccordion key={orderId(order)} order={order} />
            ))}
          </Accordion>

          {totalPages > 1 && <Pagination page={page} setPage={setPage} totalPages={totalPages} />}
        </>
      )}
    </div>
  );
}

function OrderAccordion({ order }: { order: Order }) {
  const { t } = useTranslation("profile");
  const statusKey = STATUS_KEY[order.status] ?? order.status;
  const tracking = order.shipping?.trackingNumber;

  return (
    <AccordionItem
      value={orderId(order)}
      className="rounded-xl border-0 bg-white transition-colors data-[state=open]:bg-[#F7F5EE]"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline [&>svg]:size-5 [&>svg]:text-ink-900">
        <div className="flex w-full items-center gap-4 pr-4">
          <span
            className="h-[51px] w-1 shrink-0 rounded"
            style={{ backgroundColor: statusColor(order.status) }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-base text-ink-900">
              {t("orders.orderNumber", {
                id: order.orderNumber,
                date: formatDate(order.createdAt),
              })}
            </p>
            <p className="mt-1 text-sm text-[#5B5D5D]">{t(`orders.status.${statusKey}`)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#9E9B90]">{t("orders.amount")}</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">{formatZl(order.totalAmount)}</p>
          </div>
          <div className="flex items-center gap-2">
            {order.items.slice(0, 3).map((it, idx) => (
              <span
                key={idx}
                className="flex size-[60px] items-center justify-center rounded-md bg-cream-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.imageUrl || PRODUCT_IMAGE_FALLBACK}
                  alt=""
                  className="h-12 w-auto object-contain"
                />
              </span>
            ))}
            {order.items.length > 3 && (
              <span className="font-taranka-display text-base text-ink-900">
                +{order.items.length - 3}
              </span>
            )}
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-4">
        <ul className="space-y-3 pl-5">
          {order.items.map((it, idx) => (
            <li key={idx} className="flex items-center gap-4 rounded-md bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.imageUrl || PRODUCT_IMAGE_FALLBACK}
                alt={it.name}
                className="size-[60px] shrink-0 object-contain"
              />
              <div className="flex-1 min-w-0">
                <p className="text-base text-ink-900">{it.name}</p>
              </div>
              <p className="text-base text-ink-900 tabular-nums">
                {it.quantity} {t("orders.pieces")}
              </p>
              <p className="w-[110px] text-right text-base font-semibold text-ink-900 tabular-nums">
                {formatZl(it.price)}
              </p>
            </li>
          ))}
        </ul>

        <Separator className="my-4" />
        <div className="space-y-2 px-3">
          <div className="flex items-center justify-between">
            <p className="text-base text-ink-900">{t("orders.subtotal")}</p>
            <p className="text-base text-ink-900">{formatZl(order.subtotal)}</p>
          </div>
          {(order.discountAmount ?? 0) > 0 && (
            <div className="flex items-center justify-between font-semibold text-[#188E55]">
              <p className="text-base">
                {t("orders.discount")}
                {order.subtotal > 0
                  ? ` (${Math.round((order.discountAmount / order.subtotal) * 100)}%)`
                  : ""}
              </p>
              <p className="text-base tabular-nums">−{formatZl(order.discountAmount)}</p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-base text-ink-900">{t("orders.shipping")}</p>
            <p className="text-base text-ink-900">{formatZl(order.shippingCost)}</p>
          </div>
        </div>

        {tracking && (
          <div className="mt-2 flex items-center justify-between px-3">
            <p className="text-base text-ink-900">{t("orders.tracking")}</p>
            <p className="font-mono text-base text-ink-900">{tracking}</p>
          </div>
        )}

        <Separator className="my-4" />
        <div className="flex items-center justify-between px-3">
          <p className="text-base font-bold text-ink-900">{t("orders.total")}</p>
          <p className="text-base font-bold text-ink-900">{formatZl(order.totalAmount)}</p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            type="button"
            className="inline-flex h-12 w-[270px] items-center justify-center rounded-full border border-brand-red-500 text-base font-medium text-brand-red-500 transition-all hover:-translate-y-0.5 hover:bg-brand-red-500 hover:text-cream-50 active:translate-y-0"
          >
            {t("orders.repeatOrder")}
          </button>
          <button
            type="button"
            className="inline-flex h-12 w-[261px] items-center justify-center gap-2 rounded-full border border-brand-red-500 text-base font-medium text-brand-red-500 transition-all hover:-translate-y-0.5 hover:bg-brand-red-500 hover:text-cream-50 active:translate-y-0"
          >
            {t("orders.saveResult")}
            <FileDown className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function Pagination({
  page,
  setPage,
  totalPages,
}: {
  page: number;
  setPage: (p: number) => void;
  totalPages: number;
}) {
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1, 2, 3, "...", totalPages - 2, totalPages - 1, totalPages);
  }

  return (
    <div className="mt-6 flex items-center justify-end gap-2">
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dot-${i}`} className="flex size-10 items-center justify-center text-sm text-ink-900">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => setPage(p)}
            className={`flex size-10 items-center justify-center rounded-lg text-sm transition-colors ${
              page === p
                ? "bg-black/5 font-medium text-ink-900"
                : "text-ink-900/60 hover:bg-black/5 hover:text-ink-900"
            }`}
          >
            {p}
          </button>
        )
      )}
    </div>
  );
}
