"use client";

import Link from "next/link";
import { Heart, Check } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-store";

export interface CatalogProduct {
  id: number | string;
  name: string;
  weight: string;
  oldPrice: string;
  newPrice: string;
  image: string;
}

const parsePrice = (str: string) => parseFloat(str.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;

export function CatalogCard({ product }: { product: CatalogProduct }) {
  const addItem = useCart((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({
      id: String(product.id),
      name: product.name,
      weight: product.weight,
      image: product.image,
      oldPrice: parsePrice(product.oldPrice),
      newPrice: parsePrice(product.newPrice),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article className="group flex h-[372px] w-[282px] flex-col rounded-[20px] bg-white px-6 pb-6 pt-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-12px_rgba(39,36,34,0.18)]">
      <Link
        href={`/products/${product.id}`}
        className="flex h-[174px] w-full cursor-pointer items-center justify-center overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-auto object-contain transition-transform duration-500 group-hover:scale-110"
        />
      </Link>

      <div className="mt-[15px] flex flex-1 flex-col">
        <Link
          href={`/products/${product.id}`}
          className="text-base font-semibold leading-tight text-[#443029] transition-colors group-hover:text-brand-red-500"
        >
          {product.name}
        </Link>
        <p className="mt-1 text-sm text-[#443029]">{product.weight}</p>

        <div className="mt-1 flex items-baseline gap-4">
          <span className="text-base text-[#B5B2A7] line-through">{product.oldPrice}</span>
          <span className="text-xl font-bold text-[#443029]">{product.newPrice}</span>
        </div>

        <div className="mt-auto flex items-center gap-4">
          <button
            type="button"
            aria-label="Dodaj do ulubionych"
            className="flex size-12 shrink-0 items-center justify-center rounded-full border border-brand-red-500 text-brand-red-500 transition-all duration-300 hover:scale-110 hover:bg-brand-red-500 hover:text-cream-50 active:scale-95"
          >
            <Heart className="size-6" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand-red-500 px-6 text-base font-medium text-cream-50 shadow-[0_0_0_0_rgba(170,60,55,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-700 hover:shadow-[0_8px_24px_-4px_rgba(170,60,55,0.5)] active:translate-y-0"
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
