"use client";

import { useState } from "react";
import { Info, FileDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/shadcn/accordion";
import { Separator } from "@/components/shadcn/separator";

interface OrderItem {
  id: number;
  name: string;
  weight: string;
  qty: number;
  price: number;
  image: string;
}

interface Order {
  id: string;
  date: string;
  status: "Dostarczone" | "W trakcie" | "Anulowane";
  amount: number;
  items: OrderItem[];
  shipping: number;
}

const sampleItems: OrderItem[] = Array.from({ length: 4 }, (_, i) => ({
  id: i,
  name: "Chrupiąca mieszanka orzeszków ziemnych",
  weight: "1 kg",
  qty: 10,
  price: 1234,
  image: "/categories/product-chrupki.png",
}));

const orders: Order[] = Array.from({ length: 5 }, (_, i) => ({
  id: `12234${i + 5}`,
  date: "10.10.2024",
  status: "Dostarczone",
  amount: 1234,
  items: sampleItems,
  shipping: 150,
}));

export function ProfileOrders() {
  const [page, setPage] = useState(1);
  const totalPages = 10;

  return (
    <div className="flex-1 rounded-[20px] bg-white p-8 font-taranka-body">
      <div className="flex items-center justify-between gap-6">
        <h1 className="font-taranka-display text-2xl font-extrabold uppercase tracking-wide text-ink-900">
          Historia zamówień
        </h1>
        <div className="flex items-center gap-2 font-taranka-display text-base text-brand-red-500">
          <Info className="size-4" strokeWidth={1.75} />
          Rabat w wysokości 3%
        </div>
      </div>

      <Accordion type="single" collapsible defaultValue={orders[0].id} className="mt-8 space-y-3">
        {orders.map((order) => (
          <OrderAccordion key={order.id} order={order} />
        ))}
      </Accordion>

      <Pagination page={page} setPage={setPage} totalPages={totalPages} />
    </div>
  );
}

function OrderAccordion({ order }: { order: Order }) {
  const total = order.items.reduce((s, it) => s + it.price * 0 + it.price, 0) * order.items.length + order.shipping;
  const grand = 21150;

  return (
    <AccordionItem
      value={order.id}
      className="rounded-xl border-0 bg-white transition-colors data-[state=open]:bg-[#F7F5EE]"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline [&>svg]:size-5 [&>svg]:text-ink-900">
        <div className="flex w-full items-center gap-4 pr-4">
          <span className="h-[51px] w-1 shrink-0 rounded bg-[#188E55]" />
          <div className="flex-1 min-w-0">
            <p className="text-base text-ink-900">
              Zamówienie nr {order.id}, {order.date}
            </p>
            <p className="mt-1 text-sm text-[#5B5D5D]">{order.status}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#9E9B90]">Kwota</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">{order.amount} EUR</p>
          </div>
          <div className="flex items-center gap-2">
            {order.items.slice(0, 3).map((it) => (
              <span
                key={it.id}
                className="flex size-[60px] items-center justify-center rounded-md bg-cream-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.image} alt="" className="h-12 w-auto object-contain" />
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
          {order.items.map((it) => (
            <li key={it.id} className="flex items-center gap-4 rounded-md bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.image}
                alt={it.name}
                className="size-[60px] shrink-0 object-contain"
              />
              <div className="flex-1">
                <p className="text-base text-ink-900">{it.name}</p>
                <p className="mt-1 text-sm text-[#5B5D5D]">{it.weight}</p>
              </div>
              <p className="text-base text-ink-900 tabular-nums">{it.qty} szt.</p>
              <p className="w-[100px] text-right text-base font-semibold text-ink-900 tabular-nums">
                {it.price} EUR
              </p>
            </li>
          ))}
        </ul>

        <Separator className="my-4" />
        <div className="flex items-center justify-between px-3">
          <p className="text-base font-semibold text-ink-900">Wysyłka</p>
          <p className="text-base font-semibold text-ink-900">{order.shipping} EUR</p>
        </div>
        <Separator className="my-4" />
        <div className="flex items-center justify-between px-3">
          <p className="text-base font-bold text-ink-900">Całkowity</p>
          <p className="text-base font-bold text-ink-900">{grand} EUR</p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            type="button"
            className="inline-flex h-12 w-[270px] items-center justify-center rounded-full border border-brand-red-500 text-base font-medium text-brand-red-500 transition-all hover:-translate-y-0.5 hover:bg-brand-red-500 hover:text-cream-50 active:translate-y-0"
          >
            powtórzenie zamówienia
          </button>
          <button
            type="button"
            className="inline-flex h-12 w-[261px] items-center justify-center gap-2 rounded-full border border-brand-red-500 text-base font-medium text-brand-red-500 transition-all hover:-translate-y-0.5 hover:bg-brand-red-500 hover:text-cream-50 active:translate-y-0"
          >
            utrzymywać wynik
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
