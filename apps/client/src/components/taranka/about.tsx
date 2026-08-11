"use client";

import { useTranslation } from "react-i18next";

export function TarankaAbout() {
  const { t } = useTranslation("common");

  return (
    <section className="bg-background py-16 font-taranka-body text-ink-900">
      <div className="mx-auto max-w-[1440px] px-[120px]">
        <h2 className="font-taranka-display text-[48px] font-extrabold uppercase leading-none">
          {t("about.heading")}
        </h2>

        <div className="mt-[22px] space-y-[24px] text-base leading-[24px]">
          <p>{t("about.paragraph1")}</p>
          <p>{t("about.paragraph2")}</p>
        </div>

        <button
          type="button"
          className="group mt-[28px] inline-flex items-center font-taranka-display text-sm font-extrabold uppercase tracking-wide text-brand-red-500 transition-transform duration-300 hover:translate-x-1"
        >
          {t("about.more")}
        </button>
      </div>
    </section>
  );
}
