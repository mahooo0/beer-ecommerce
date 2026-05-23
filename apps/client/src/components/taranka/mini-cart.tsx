"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ShoppingCart, Minus, Plus, Trash2, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { Button } from "@/components/shadcn/button";
import { Separator } from "@/components/shadcn/separator";
import { Checkbox } from "@/components/shadcn/checkbox";
import { useCart } from "@/lib/cart-store";

export function MiniCart({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const items = useCart((s) => s.items);
  const updateQty = useCart((s) => s.updateQty);
  const removeItem = useCart((s) => s.removeItem);

  const subtotal = items.reduce((s, it) => s + it.newPrice * it.qty, 0);
  const shipping = items.length > 0 ? 200 : 0;
  const discount = items.reduce((s, it) => s + (it.oldPrice - it.newPrice) * it.qty, 0);
  const total = subtotal + shipping;

  const fmt = (v: number) => v.toFixed(2).replace(".", ",") + " EUR";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={12}
        className="w-[511px] rounded-2xl border-0 bg-white p-0 font-taranka-body shadow-[0_20px_50px_-12px_rgba(39,36,34,0.25)]"
      >
        <div className="flex items-center justify-between px-9 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <span className="flex size-9 items-center justify-center rounded-full bg-brand-red-500 text-cream-50">
              <ShoppingCart className="size-5" strokeWidth={1.75} />
            </span>
            <h2 className="font-taranka-display text-xl font-extrabold uppercase tracking-wide text-ink-900">
              Koszyk
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Zamknij"
            className="text-ink-900 transition-colors hover:text-brand-red-500"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>

        <Separator className="bg-cream-300" />

        {items.length === 0 ? (
          <div className="px-9 py-12 text-center text-base text-[#9E9B90]">
            Koszyk jest pusty. Dodaj produkty z katalogu.
          </div>
        ) : (
          <div className="max-h-[428px] overflow-y-auto px-9">
            <ul>
              {items.map((item) => (
                <li
                  key={item.id}
                  className="grid grid-cols-[40px_1fr_auto] gap-x-4 gap-y-2 border-b border-cream-200 py-4 last:border-b-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="size-10 object-contain"
                  />

                  <div className="min-w-0">
                    <p className="text-sm leading-tight text-ink-900">{item.name}</p>
                    <p className="mt-1 text-sm text-ink-900">{item.weight}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label="Usuń produkt"
                    className="text-[#9E9B90] transition-colors hover:text-brand-red-500"
                  >
                    <Trash2 className="size-5" strokeWidth={1.5} />
                  </button>

                  <div className="col-start-1 col-end-3 flex items-center justify-between">
                    <div className="inline-flex h-[30px] w-[94px] items-center justify-between rounded-full border border-[#9E9B90] px-2">
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, -1)}
                        aria-label="Zmniejsz ilość"
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
                        aria-label="Zwiększ ilość"
                        className="text-ink-900 transition-colors hover:text-brand-red-500"
                      >
                        <Plus className="size-3.5" strokeWidth={1.75} />
                      </button>
                    </div>

                    <div className="flex items-baseline gap-3">
                      <span className="text-sm font-bold text-[#9E9B90] line-through">
                        {item.oldPrice.toFixed(2)} EUR
                      </span>
                      <span className="text-base font-bold text-[#443029]">
                        {item.newPrice.toFixed(2)} EUR
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator className="bg-cream-300" />

        <div className="px-9 pt-5 pb-4">
          <SummaryRow label="Razem:" value={fmt(total)} />
          <SummaryRow label="Dostawa:" value={fmt(shipping)} />
          <SummaryRow label="Twój rabat:" value={fmt(discount)} />
        </div>

        <div className="flex items-center gap-6 px-9 pb-4">
          <Button
            asChild
            disabled={items.length === 0}
            className="h-12 w-[218px] rounded-full bg-brand-red-500 text-base font-medium text-cream-50 shadow-[0_0_0_0_rgba(170,60,55,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-700 hover:shadow-[0_8px_24px_-4px_rgba(170,60,55,0.5)] disabled:pointer-events-none disabled:opacity-50"
          >
            <Link href="/cart">Złożyć zamówienie</Link>
          </Button>
          <Button
            asChild
            variant="link"
            className="h-12 px-0 text-base font-medium text-ink-900 hover:text-brand-red-500"
          >
            <Link href="/products" onClick={() => setOpen(false)}>
              Kontynuować zakupy
            </Link>
          </Button>
        </div>

        <div className="flex items-start gap-3 border-t border-cream-200 px-9 py-4">
          <Checkbox
            id="mini-cart-accept"
            checked={accepted}
            onCheckedChange={(v) => setAccepted(v === true)}
            className="mt-0.5"
          />
          <label
            htmlFor="mini-cart-accept"
            className="cursor-pointer text-sm text-ink-900"
          >
            Zamawiając towary, akceptuję warunki oferty publicznej
          </label>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-1.5">
      <span className="text-base font-semibold text-ink-900">{label}</span>
      <span className="text-base font-semibold text-ink-900">{value}</span>
    </div>
  );
}
