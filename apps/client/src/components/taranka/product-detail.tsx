"use client";

import { useState } from "react";
import { Heart, Minus, Plus, CheckCircle2, Truck, CreditCard, Check } from "lucide-react";
import { useCart } from "@/lib/cart-store";

const thumbs = [
  "/product/image0.png",
  "/product/image0.png",
  "/product/image0.png",
  "/product/image0.png",
  "/product/image0.png",
];

const specs = [
  { label: "Charakterystyka:", value: "Charakterystyka" },
  { label: "Charakterystyka:", value: "Charakterystyka" },
  { label: "Charakterystyka:", value: "Charakterystyka" },
];

export function TarankaProductDetail() {
  const [activeThumb, setActiveThumb] = useState(0);
  const [qty, setQty] = useState(10);
  const [added, setAdded] = useState(false);
  const addItem = useCart((s) => s.addItem);

  const handleAddToCart = () => {
    addItem(
      {
        id: "chrupki-kukurydziane-mleko",
        name: "Chrupki kukurydziane słodkie o smaku mleka",
        weight: "140 g",
        image: "/product/image0.png",
        oldPrice: 1.95,
        newPrice: 1.25,
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
              src={thumbs[activeThumb]}
              alt="Chrupki kukurydziane słodkie o smaku mleka"
              className="h-[358px] w-auto object-contain"
            />
          </div>

          <div className="mt-6 flex gap-[23px]">
            {thumbs.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveThumb(i)}
                className={`relative flex h-[77px] w-[79px] items-center justify-center rounded-[3.6px] bg-white transition-all ${
                  i === activeThumb
                    ? "ring-2 ring-brand-red-500 ring-offset-2"
                    : "opacity-70 hover:opacity-100"
                }`}
                aria-label={`Wybierz zdjęcie ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-[65px] w-auto object-contain" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <h1 className="text-[32px] font-semibold leading-[42px] text-[#443029]">
            Chrupki kukurydziane słodkie o smaku mleka
          </h1>

          <p className="mt-3 text-2xl font-semibold text-[#443029]">140 g</p>

          <p className="mt-6 inline-flex items-center gap-2 text-base text-[#188E55]">
            <CheckCircle2 className="size-4" strokeWidth={2} />
            w magazynie 123 sztuki
          </p>

          <dl className="mt-8 space-y-2">
            {specs.map((s, i) => (
              <div key={i} className="flex gap-6 text-base text-[#2B2A29]">
                <dt className="w-[155px] font-semibold">{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 space-y-2">
            <p className="text-xl font-bold text-[#9E9B90] line-through">
              1.95 EUR <span className="font-normal text-base">cena detaliczna</span>
            </p>
            <p className="text-2xl font-bold text-[#443029]">
              1.25 EUR <span className="font-normal text-base">cena hurtowa</span>
            </p>
          </div>

          <div className="mt-9 flex items-center gap-3">
            <div className="inline-flex h-[30px] w-24 items-center justify-between rounded-full border border-[#9E9B90] px-2">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Zmniejsz ilość"
                className="text-ink-900 transition-colors hover:text-brand-red-500"
              >
                <Minus className="size-4" strokeWidth={1.75} />
              </button>
              <span className="text-base font-medium text-ink-900 tabular-nums">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                aria-label="Zwiększ ilość"
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
                  <Check className="size-4" strokeWidth={2.5} /> Dodano
                </>
              ) : (
                "Do koszyka"
              )}
            </button>

            <button
              type="button"
              className="inline-flex h-12 w-[255px] items-center justify-center whitespace-nowrap rounded-full border border-brand-red-500 px-6 text-base font-medium text-brand-red-500 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-500 hover:text-cream-50 active:translate-y-0"
            >
              szybkie zamówienie
            </button>

            <button
              type="button"
              aria-label="Dodaj do ulubionych"
              className="flex size-12 shrink-0 items-center justify-center rounded-full border border-brand-red-500 text-brand-red-500 transition-all duration-300 hover:scale-110 hover:bg-brand-red-500 hover:text-cream-50 active:scale-95"
            >
              <Heart className="size-5" strokeWidth={1.75} />
            </button>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-x-12">
            <InfoColumn icon={Truck} title="Dostawa">
              <p className="font-semibold text-ink-900">InPost Paczkomaty</p>
              <p className="mt-2 text-[#2B2A29]">
                Lorem ipsum dolor sit amet consectetur. Massa dolor id purus hendrerit tellus quis
                turpis ridiculus ut. Velit rutrum sed eu lacus vitae sodales proin eleifend morbi.
              </p>
            </InfoColumn>
            <InfoColumn icon={CreditCard} title="Płatność" muted>
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
