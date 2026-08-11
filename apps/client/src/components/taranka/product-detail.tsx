"use client";

import { useState } from "react";
import { Heart, Minus, Plus, CheckCircle2, Truck, CreditCard, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCart } from "@/lib/cart-store";

export interface ProductDetailData {
  id: string;
  slug: string;
  name: string;
  weight: string;
  images: string[];
  /** Current price in major units (e.g. 6.45). */
  price: number;
  /** Optional crossed-out price in major units. */
  oldPrice?: number;
  /** Total available stock, or null when unknown. */
  stock: number | null;
  specs: { label: string; value: string }[];
}

const IMAGE_FALLBACK = "/categories/product-chrupki.png";
const fmt = (v: number) => `${v.toFixed(2)} zł`;

export function TarankaProductDetail({ product }: { product: ProductDetailData }) {
  const images = product.images.length > 0 ? product.images : [IMAGE_FALLBACK];
  const [activeThumb, setActiveThumb] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCart((s) => s.addItem);
  const { t } = useTranslation("catalog");

  const handleAddToCart = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        weight: product.weight,
        image: images[0] ?? IMAGE_FALLBACK,
        oldPrice: product.oldPrice ?? product.price,
        newPrice: product.price,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article className="font-taranka-body">
      <div className="flex gap-6">
        <div className="w-[484px] shrink-0">
          <div className="flex h-[487px] items-center justify-center rounded-[20px] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[activeThumb] ?? images[0]}
              alt={product.name}
              className="h-[358px] w-auto object-contain"
            />
          </div>

          {images.length > 1 && (
            <div className="mt-6 flex gap-[23px]">
              {images.slice(0, 5).map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveThumb(i)}
                  className={`relative flex h-[77px] w-[79px] items-center justify-center rounded-[3.6px] bg-white transition-all ${
                    i === activeThumb
                      ? "ring-2 ring-brand-red-500 ring-offset-2"
                      : "opacity-70 hover:opacity-100"
                  }`}
                  aria-label={t("detail.selectImage", { index: i + 1 })}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-[65px] w-auto object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-[32px] font-semibold leading-[42px] text-[#443029]">
            {product.name}
          </h1>

          {product.weight && (
            <p className="mt-3 text-2xl font-semibold text-[#443029]">{product.weight}</p>
          )}

          {product.stock != null && (
            <p
              className={`mt-6 inline-flex items-center gap-2 text-base ${
                product.stock > 0 ? "text-[#188E55]" : "text-brand-red-500"
              }`}
            >
              <CheckCircle2 className="size-4" strokeWidth={2} />
              {product.stock > 0
                ? t("detail.inStock", { count: product.stock })
                : t("detail.outOfStock")}
            </p>
          )}

          {product.specs.length > 0 && (
            <dl className="mt-8 space-y-2">
              {product.specs.map((s, i) => (
                <div key={i} className="flex gap-6 text-base text-[#2B2A29]">
                  <dt className="w-[155px] font-semibold">{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-6 space-y-2">
            {product.oldPrice != null && product.oldPrice > product.price && (
              <p className="text-xl font-bold text-[#9E9B90] line-through">
                {fmt(product.oldPrice)}{" "}
                <span className="font-normal text-base">{t("detail.retailPrice")}</span>
              </p>
            )}
            <p className="text-2xl font-bold text-[#443029]">
              {fmt(product.price)}{" "}
              <span className="font-normal text-base">{t("detail.wholesalePrice")}</span>
            </p>
          </div>

          <div className="mt-9 flex items-center gap-3">
            <div className="inline-flex h-[30px] w-24 items-center justify-between rounded-full border border-[#9E9B90] px-2">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label={t("detail.decreaseQty")}
                className="text-ink-900 transition-colors hover:text-brand-red-500"
              >
                <Minus className="size-4" strokeWidth={1.75} />
              </button>
              <span className="text-base font-medium text-ink-900 tabular-nums">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                aria-label={t("detail.increaseQty")}
                className="text-ink-900 transition-colors hover:text-brand-red-500"
              >
                <Plus className="size-4" strokeWidth={1.75} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="group inline-flex h-12 w-[184px] items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand-red-500 px-6 text-base font-medium text-cream-50 shadow-[0_0_0_0_rgba(170,60,55,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-700 hover:shadow-[0_8px_24px_-4px_rgba(170,60,55,0.5)] active:translate-y-0"
            >
              {added ? (
                <>
                  <Check className="size-4" strokeWidth={2.5} /> {t("detail.added")}
                </>
              ) : (
                t("detail.addToCart")
              )}
            </button>

            <button
              type="button"
              className="inline-flex h-12 w-[255px] items-center justify-center whitespace-nowrap rounded-full border border-brand-red-500 px-6 text-base font-medium text-brand-red-500 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-500 hover:text-cream-50 active:translate-y-0"
            >
              {t("detail.quickOrder")}
            </button>

            <button
              type="button"
              aria-label={t("detail.addToFavorites")}
              className="flex size-12 shrink-0 items-center justify-center rounded-full border border-brand-red-500 text-brand-red-500 transition-all duration-300 hover:scale-110 hover:bg-brand-red-500 hover:text-cream-50 active:scale-95"
            >
              <Heart className="size-5" strokeWidth={1.75} />
            </button>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-x-12">
            <InfoColumn icon={Truck} title={t("detail.delivery")}>
              <p className="font-semibold text-ink-900">InPost Paczkomaty</p>
              <p className="mt-2 text-[#2B2A29]">
                Lorem ipsum dolor sit amet consectetur. Massa dolor id purus hendrerit tellus quis
                turpis ridiculus ut. Velit rutrum sed eu lacus vitae sodales proin eleifend morbi.
              </p>
            </InfoColumn>
            <InfoColumn icon={CreditCard} title={t("detail.payment")} muted>
              <p className="font-semibold text-ink-900">InPost Paczkomaty</p>
              <p className="mt-2 text-[#2B2A29]">
                Lorem ipsum dolor sit amet consectetur. Massa dolor id purus hendrerit tellus quis
                turpis ridiculus ut. Velit rutrum sed eu lacus vitae sodales proin eleifend morbi.
              </p>
            </InfoColumn>
          </div>
        </div>
      </div>
    </article>
  );
}

function InfoColumn({
  icon: Icon,
  title,
  muted,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <Icon className={muted ? "size-5 text-[#9E9B90]" : "size-5 text-ink-900"} strokeWidth={1.75} />
        <h2
          className={`font-taranka-display text-xl font-extrabold uppercase ${
            muted ? "text-[#9E9B90]" : "text-ink-900"
          }`}
        >
          {title}
        </h2>
      </div>
      <div className="mt-6 text-base leading-[24px]">{children}</div>
    </div>
  );
}
