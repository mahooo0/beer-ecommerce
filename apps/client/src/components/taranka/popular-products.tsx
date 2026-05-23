"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Check } from "lucide-react";
import { HeroArrowIcon } from "./icons";
import { useCart } from "@/lib/cart-store";

interface Product {
  id: number;
  name: string;
  weight: string;
  oldPrice: string;
  newPrice: string;
  image: string;
}

const products: Product[] = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  name: "Chrupki kukurydziane słodkie o smaku mleka",
  weight: "140g",
  oldPrice: "6.45zł",
  newPrice: "6.45zł",
  image: "/categories/product-chrupki.png",
}));

const parsePrice = (s: string) =>
  parseFloat(s.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;

function PopularProductCard({ product: p }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({
      id: String(p.id),
      name: p.name,
      weight: p.weight,
      image: p.image,
      oldPrice: parsePrice(p.oldPrice),
      newPrice: parsePrice(p.newPrice),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article className="group flex h-[380px] flex-col gap-4 rounded-[20px] bg-white px-[25px] pt-4 pb-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-12px_rgba(39,36,34,0.18)]">
      <Link
        href={`/products/${p.id}`}
        className="flex h-[174px] w-full cursor-pointer items-center justify-center overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.image}
          alt={p.name}
          className="h-full w-auto object-contain transition-transform duration-500 group-hover:scale-110"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        <Link
          href={`/products/${p.id}`}
          className="text-base font-semibold leading-tight text-[#443029] transition-colors group-hover:text-brand-red-500"
        >
          {p.name}
        </Link>
        <p className="text-sm text-[#443029]">{p.weight}</p>

        <div className="mt-1 flex items-center gap-4">
          <span className="text-base text-cream-300 line-through">{p.oldPrice}</span>
          <span className="text-xl font-bold text-[#443029]">{p.newPrice}</span>
        </div>

        <div className="mt-auto flex items-center gap-6">
          <button
            type="button"
            aria-label="Dodaj do ulubionych"
            className="flex size-12 items-center justify-center rounded-full border border-brand-red-500 text-brand-red-500 transition-all duration-300 hover:scale-110 hover:bg-brand-red-500 hover:text-cream-50 active:scale-95"
          >
            <Heart className="size-6 transition-all duration-300" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="group/btn inline-flex h-12 w-[158px] items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand-red-500 px-[33px] text-base font-medium text-cream-50 shadow-[0_0_0_0_rgba(170,60,55,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-700 hover:shadow-[0_8px_24px_-4px_rgba(170,60,55,0.5)] active:translate-y-0"
          >
            {added ? (
              <>
                <Check className="size-4" strokeWidth={2.5} /> Dodano
              </>
            ) : (
              "Do koszyka"
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

export function TarankaPopularProducts() {
  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-[1196px] px-6">
        <h2 className="font-taranka-display text-[48px] font-extrabold uppercase leading-none text-ink-900">
          Popularne produkty
        </h2>

        <div className="mt-9 grid grid-cols-4 gap-6">
          {products.map((p) => (
            <PopularProductCard key={p.id} product={p} />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/products"
            className="group inline-flex h-12 items-center justify-center gap-3 whitespace-nowrap rounded-full bg-brand-red-500 px-9 text-base font-medium text-cream-50 shadow-[0_0_0_0_rgba(170,60,55,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-700 hover:shadow-[0_8px_24px_-4px_rgba(170,60,55,0.5)] active:translate-y-0"
          >
            Do wszystkich produktów
            <HeroArrowIcon className="h-3 w-[35px] transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
