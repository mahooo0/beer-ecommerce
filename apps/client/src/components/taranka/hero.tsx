"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { HeroArrowIcon, HeroWavesIcon } from "./icons";

export function TarankaHero() {
  const { t } = useTranslation("home");
  return (
    <section
      className="relative h-[440px] w-full bg-cover bg-center font-taranka-body text-cream-50"
      style={{ backgroundImage: "url(/hero-beer.png)" }}
    >
      <div className="flex h-full max-w-[1440px] mx-auto items-center pl-[174px]">
        <div className="flex w-[514px] flex-col gap-3">
          <p className="text-xl font-medium">{t("hero.eyebrow")}</p>
          <h1 className="font-taranka-display text-[72px] font-extrabold uppercase leading-none">
            {t("hero.title")}
          </h1>
          <p className="text-xl font-medium">{t("hero.subtitle")}</p>

          <div className="mt-3 flex gap-3">
            <Link
              href="/products"
              className="group inline-flex h-12 w-[249px] items-center justify-center gap-3 whitespace-nowrap rounded-full bg-brand-red-500 px-6 text-base font-medium text-cream-50 shadow-[0_0_0_0_rgba(170,60,55,0.4)] transition-all duration-300 hover:bg-brand-red-700 hover:shadow-[0_8px_24px_-4px_rgba(170,60,55,0.5)] hover:-translate-y-0.5 active:translate-y-0"
            >
              {t("hero.learnMore")}
              <HeroArrowIcon className="h-3 w-[35px] transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/products"
              className="group inline-flex h-12 w-[249px] items-center justify-center gap-3 whitespace-nowrap rounded-full border border-cream-50 px-6 text-base font-medium text-cream-50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-cream-50 hover:text-ink-900 active:translate-y-0"
            >
              {t("hero.learnMore")}
              <HeroWavesIcon className="h-[19px] w-[35px] transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
