"use client";

import { Eye } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

const baseNews = [
  { image: "/news/image0.jpg", date: "11.11.2023", views: "4356", title: "Historia ukraińskiego piwa" },
  { image: "/news/image1.jpg", date: "11.11.2023", views: "4356", title: "Historia ukraińskiego piwa" },
  { image: "/news/image2.jpg", date: "11.11.2023", views: "4356", title: "Historia ukraińskiego piwa" },
  { image: "/news/image3.jpg", date: "11.11.2023", views: "4356", title: "Historia ukraińskiego piwa" },
  { image: "/news/image4.jpg", date: "11.11.2023", views: "4356", title: "Historia ukraińskiego piwa" },
  { image: "/news/image5.jpg", date: "11.11.2023", views: "4356", title: "Historia ukraińskiego piwa" },
];

const news = [...baseNews, ...baseNews];

export function TarankaNewsSlider() {
  return (
    <section className="overflow-hidden bg-background py-16 font-taranka-body">
      <h2 className="mb-9 pl-[120px] font-taranka-display text-[48px] font-extrabold uppercase leading-none text-ink-900">
        Przydatne wiadomości
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
        {news.map((item, i) => (
          <SwiperSlide key={i} className="!w-[282px]">
            <article className="group w-[282px] cursor-pointer">
              <div className="h-[220px] w-[282px] overflow-hidden rounded-[20px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              <div className="mt-5 flex items-center gap-4 text-xs text-[#443029]">
                <span>{item.date}</span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="size-4" strokeWidth={1.75} />
                  {item.views}
                </span>
              </div>

              <h3 className="mt-2 text-[20px] font-semibold leading-tight text-[#443029] transition-colors group-hover:text-brand-red-500">
                {item.title}
              </h3>

              <span className="mt-1 inline-block font-taranka-display text-sm font-extrabold uppercase tracking-wide text-brand-red-500 transition-transform duration-300 group-hover:translate-x-1">
                więcej
              </span>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
