"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

export interface NewsSlide {
  image: string;
  date: string;
  title: string;
  href?: string;
  meta?: string; // category name / views
}

// Fallback used only when no posts are passed (CMS empty or unreachable).
const baseNews: NewsSlide[] = [
  { image: "/news/image0.jpg", date: "11.11.2023", title: "Historia ukraińskiego piwa" },
  { image: "/news/image1.jpg", date: "11.11.2023", title: "Historia ukraińskiego piwa" },
  { image: "/news/image2.jpg", date: "11.11.2023", title: "Historia ukraińskiego piwa" },
  { image: "/news/image3.jpg", date: "11.11.2023", title: "Historia ukraińskiego piwa" },
  { image: "/news/image4.jpg", date: "11.11.2023", title: "Historia ukraińskiego piwa" },
  { image: "/news/image5.jpg", date: "11.11.2023", title: "Historia ukraińskiego piwa" },
];

export function TarankaNewsSlider({ items }: { items?: NewsSlide[] }) {
  const source = items && items.length > 0 ? items : baseNews;
  // Swiper's infinite loop needs enough slides — repeat when there are few posts.
  const slides: NewsSlide[] =
    source.length >= 6 ? source : Array.from({ length: 6 }, (_, i) => source[i % source.length]!);

  const { t } = useTranslation("home");
  return (
    <section className="overflow-hidden bg-background py-16 font-taranka-body">
      <h2 className="mb-9 pl-[120px] font-taranka-display text-[48px] font-extrabold uppercase leading-none text-ink-900">
        {t("newsSlider.heading")}
      </h2>

      <Swiper
        modules={[Autoplay]}
        slidesPerView="auto"
        spaceBetween={24}
        loop
        speed={3000}
        autoplay={{
          delay: 0,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        slidesOffsetBefore={120}
        slidesOffsetAfter={120}
        className="!overflow-visible"
      >
        {slides.map((item, i) => {
          const inner = (
            <article className="group w-[282px] cursor-pointer">
              <div className="h-[220px] w-[282px] overflow-hidden rounded-[20px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              <div className="mt-5 flex items-center gap-3 text-xs text-[#443029]">
                <span>{item.date}</span>
                {item.meta ? <span className="rounded-full bg-black/5 px-2.5 py-0.5">{item.meta}</span> : null}
              </div>

              <h3 className="mt-2 text-[20px] font-semibold leading-tight text-[#443029] transition-colors group-hover:text-brand-red-500">
                {item.title}
              </h3>

              <span className="mt-1 inline-block font-taranka-display text-sm font-extrabold uppercase tracking-wide text-brand-red-500 transition-transform duration-300 group-hover:translate-x-1">
                {t("newsSlider.readMore")}
              </span>
            </article>
          );

          return (
            <SwiperSlide key={i} className="!w-[282px]">
              {item.href ? (
                <Link href={item.href}>{inner}</Link>
              ) : (
                inner
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}
