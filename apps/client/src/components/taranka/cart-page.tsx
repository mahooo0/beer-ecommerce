"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-store";

export function TarankaCartPage() {
  const items = useCart((s) => s.items);
  const updateQty = useCart((s) => s.updateQty);
  const removeItem = useCart((s) => s.removeItem);

  const subtotal = items.reduce((s, it) => s + it.newPrice * it.qty, 0);
  const shipping = items.length > 0 ? 200 : 0;
  const discount = items.reduce((s, it) => s + (it.oldPrice - it.newPrice) * it.qty, 0);
  const grand = subtotal + shipping;

  const fmt = (v: number) => v.toFixed(2).replace(".", ",") + " EUR";

  return (
    <div className="font-taranka-body">
      <h1 className="font-taranka-display text-2xl font-extrabold uppercase tracking-wide text-ink-900">
        Twój koszyk
      </h1>

      <div className="mt-6 grid grid-cols-[1fr_383px] gap-6">
        <div className="rounded-[20px] bg-white p-6">
          {items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-base text-[#9E9B90]">Twój koszyk jest pusty.</p>
              <Link
                href="/products"
                className="mt-4 inline-flex h-12 items-center rounded-full bg-brand-red-500 px-6 text-base font-medium text-cream-50 transition-colors hover:bg-brand-red-700"
              >
                Przejdź do katalogu
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-cream-200">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="grid grid-cols-[60px_1fr_94px_auto_auto_auto] items-center gap-6 py-4 first:pt-0 last:pb-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="size-15 h-[60px] w-[60px] object-contain"
                  />

                  <div className="min-w-0">
                    <p className="text-sm leading-tight text-ink-900">{item.name}</p>
                    <p className="mt-1 text-sm text-ink-900">{item.weight}</p>
                  </div>

                  <div className="inline-flex h-[30px] w-[94px] items-center justify-between rounded-full border border-[#9E9B90] px-2">
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, -1)}
                      aria-label="Zmniejsz"
                      className="text-ink-900 transition-colors hover:text-brand-red-500"
                    >
                      <Minus className="size-3.5" strokeWidth={1.75} />
                    </button>
                    <span className="text-sm font-medium text-ink-900 tabular-nums">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, 1)}
                      aria-label="Zwiększ"
                      className="text-ink-900 transition-colors hover:text-brand-red-500"
                    >
                      <Plus className="size-3.5" strokeWidth={1.75} />
                    </button>
                  </div>

                  <div className="flex items-baseline gap-3 whitespace-nowrap">
                    <span className="text-sm font-bold text-[#9E9B90] line-through">
                      {item.oldPrice.toFixed(2)} EUR
                    </span>
                    <span className="text-sm font-bold text-ink-900">
                      {item.newPrice.toFixed(2)} EUR
                    </span>
                  </div>

                  <p className="whitespace-nowrap text-base font-bold text-ink-900">
                    {(item.newPrice * item.qty).toFixed(2)} EUR
                  </p>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label="Usuń produkt"
                    className="text-[#9E9B90] transition-colors hover:text-brand-red-500"
                  >
                    <Trash2 className="size-5" strokeWidth={1.5} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="h-fit rounded-[20px] bg-white p-6">
          <h2 className="font-taranka-display text-xl font-extrabold uppercase tracking-wide text-ink-900">
            Kwota zamówienia
          </h2>

          <div className="mt-5 space-y-3">
            <Row label="Razem:" value={fmt(subtotal)} />
            <Row label="Dostawa:" value={fmt(shipping)} />
            <Row label="Twój rabat:" value={fmt(discount)} />
          </div>

          <div className="mt-6 border-t border-cream-200 pt-4">
            <Row label="Łącznie:" value={fmt(grand)} bold />
          </div>

          <Link
            href="/checkout"
            aria-disabled={items.length === 0}
            tabIndex={items.length === 0 ? -1 : 0}
            className={`mt-7 inline-flex h-12 w-full items-center justify-center rounded-full bg-brand-red-500 text-base font-medium text-cream-50 shadow-[0_0_0_0_rgba(170,60,55,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-700 hover:shadow-[0_8px_24px_-4px_rgba(170,60,55,0.5)] ${
              items.length === 0 ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Złożyć zamówienie
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between ${
        bold ? "text-base font-bold" : "text-base font-semibold"
      } text-ink-900`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
