"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import type { Swiper as SwiperClass } from "swiper";
import "swiper/css";
import { CatalogCard, type CatalogProduct } from "./catalog-card";

export function TarankaProductRow({
  title,
  products,
}: {
  title: string;
  products: CatalogProduct[];
}) {
  const swiperRef = useRef<SwiperClass | null>(null);

  return (
    <section className="font-taranka-body">
      <div className="flex items-end justify-between">
        <h2 className="font-taranka-display text-[48px] font-extrabold uppercase leading-none text-ink-900">
          {title}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => swiperRef.current?.slidePrev()}
            aria-label="Poprzedni"
            className="flex size-11 items-center justify-center rounded-full border border-ink-900 text-ink-900 transition-all hover:bg-ink-900 hover:text-cream-50 active:scale-95"
          >
            <ChevronLeft className="size-5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => swiperRef.current?.slideNext()}
            aria-label="Następny"
            className="flex size-11 items-center justify-center rounded-full border border-ink-900 text-ink-900 transition-all hover:bg-ink-900 hover:text-cream-50 active:scale-95"
          >
            <ChevronRight className="size-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="mt-9 overflow-hidden">
        <Swiper
          modules={[Navigation]}
          slidesPerView="auto"
          spaceBetween={24}
          onBeforeInit={(swiper) => {
            swiperRef.current = swiper;
          }}
          className="!overflow-visible"
        >
          {products.map((p, i) => (
            <SwiperSlide key={`${p.id}-${i}`} className="!w-[282px]">
              <CatalogCard product={p} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
