"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { PromoBanner, LocalizedText } from "@repo/types";
import { HeroArrowIcon, HeroWavesIcon } from "./icons";

function pickLocale(loc: LocalizedText | undefined, lang: "pl" | "uk"): string {
  if (!loc) return "";
  return (lang === "uk" ? loc.uk : loc.pl) || loc.pl || loc.uk || "";
}

/** CTA destination: linked product → category → raw href → catalog. */
function bannerHref(banner: PromoBanner): string {
  if (banner.product?.slug) return `/products/${banner.product.slug}`;
  if (banner.category?.slug) return `/products?category=${encodeURIComponent(banner.category.slug)}`;
  return banner.href || "/products";
}

/**
 * Homepage promo block. When an admin-managed `banner` is provided the image,
 * bilingual text and CTA target come from the backend; otherwise it falls back
 * to the original hardcoded/i18n content so the section never disappears if the
 * API is empty or unreachable. Visual layout is unchanged.
 */
export function TarankaPromoBanner({ banner }: { banner?: PromoBanner | null } = {}) {
  const { t, i18n } = useTranslation("home");
  const lang: "pl" | "uk" = i18n.language?.startsWith("uk") ? "uk" : "pl";

  const isDynamic = !!banner && !!banner.image;

  const image = isDynamic ? banner!.image : "/book-ridna-ukraina.png";
  const titleLines = isDynamic
    ? pickLocale(banner!.title, lang).split("\n").filter(Boolean)
    : [t("promoBanner.line1"), t("promoBanner.line2")];
  // In the fallback the third heading line is cream; dynamic banners keep the
  // whole heading in the brand red.
  const creamHeadline = isDynamic ? "" : t("promoBanner.line3");
  const subtitleLines = isDynamic
    ? pickLocale(banner!.subtitle, lang).split("\n").filter(Boolean)
    : [t("promoBanner.desc1"), t("promoBanner.desc2")];
  const ctaLabel = isDynamic
    ? pickLocale(banner!.ctaLabel, lang) || t("promoBanner.learnMore")
    : t("promoBanner.learnMore");
  const href = isDynamic ? bannerHref(banner!) : "/products";

  return (
    <section
      className="relative h-[400px] w-full overflow-hidden bg-[#2a2622] bg-cover bg-center bg-no-repeat font-taranka-body text-cream-50"
      style={{ backgroundImage: "url(/wood-bg.png)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-full w-auto -translate-x-[720px] object-contain object-left"
      />

      <div className="relative z-10 mx-auto flex h-full w-fit max-w-[1440px] flex-col pl-[631px] pt-[54px]">
        <h2 className="font-taranka-display text-[48px] font-extrabold uppercase leading-[58px]">
          {titleLines.map((line, i) => (
            <span key={i} className="block text-[#E13B3C]">
              {line}
            </span>
          ))}
          {creamHeadline && <span className="block text-cream-50">{creamHeadline}</span>}
        </h2>

        <p className="mt-[10px] text-[20px] font-medium leading-[26px] text-cream-50">
          {subtitleLines.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </p>

        <div className="mt-[14px] flex gap-6">
          <Link
            href={href}
            className="group inline-flex h-12 w-[249px] items-center justify-center gap-3 whitespace-nowrap rounded-full bg-brand-red-500 px-6 text-base font-medium text-cream-50 shadow-[0_0_0_0_rgba(170,60,55,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-700 hover:shadow-[0_8px_24px_-4px_rgba(170,60,55,0.5)] active:translate-y-0"
          >
            {ctaLabel}
            <HeroArrowIcon className="h-3 w-[35px] transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          {/* Original layout kept a second (identical) CTA — preserve it only in
              the hardcoded fallback so dynamic banners show a single clear CTA. */}
          {!isDynamic && (
            <Link
              href="/products"
              className="group inline-flex h-12 w-[248px] items-center justify-center gap-3 whitespace-nowrap rounded-full border border-cream-50 px-6 text-base font-medium text-cream-50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-cream-50 hover:text-ink-900 active:translate-y-0"
            >
              {t("promoBanner.learnMore")}
              <HeroWavesIcon className="h-[19px] w-[35px] transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
