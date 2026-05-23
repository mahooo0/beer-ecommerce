"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

const baseCategories = [
  { label: "Snaks", image: "/categories/snaks.png" },
  { label: "Kiszonki", image: "/categories/kiszonki.png" },
  { label: "Wino", image: "/categories/wino.png" },
  { label: "Słodycze", image: "/categories/slodycze.png" },
];

// Duplicate so loop mode has enough slides (Swiper needs slidesPerView * 2 minimum)
const categories = [...baseCategories, ...baseCategories, ...baseCategories];

export function TarankaCategorySlider() {
  return (
    <section className="overflow-hidden bg-background py-12">
      <Swiper
        modules={[Autoplay]}
        slidesPerView="auto"
        spaceBetween={24}
        loop
        speed={800}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        slidesOffsetBefore={174}
        slidesOffsetAfter={174}
        className="!overflow-visible"
      >
        {categories.map((c, i) => (
          <SwiperSlide key={i} className="!w-[282px]">
            <Link
              href="/products"
              className="group relative block h-[306px] w-[282px]"
            >
              <div className="absolute inset-x-0 bottom-0 h-[219px] rounded-[20px] bg-[#D6D3C8] transition-all duration-500 group-hover:bg-ink-900 group-hover:shadow-[0_20px_40px_-12px_rgba(39,36,34,0.35)]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image}
                alt={c.label}
                className="pointer-events-none absolute left-1/2 top-0 h-[242px] w-auto max-w-[260px] -translate-x-1/2 object-contain transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-105"
              />
              <h3 className="absolute inset-x-0 bottom-[31px] text-center font-taranka-display text-2xl font-extrabold uppercase text-ink-900 transition-colors duration-500 group-hover:text-cream-50">
                {c.label}
              </h3>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
