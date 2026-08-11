"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

export function TarankaProductDescription({ description }: { description?: string } = {}) {
  const [active, setActive] = useState(0);
  const { t } = useTranslation("catalog");

  const skladContent = (
    <ul className="list-disc space-y-2 pl-5">
      <li>{t("description.ingredients.cornFlour")}</li>
      <li>{t("description.ingredients.sugar")}</li>
      <li>{t("description.ingredients.vegetableOil")}</li>
      <li>{t("description.ingredients.milkFlavor")}</li>
      <li>{t("description.ingredients.salt")}</li>
      <li>{t("description.ingredients.vitamins")}</li>
    </ul>
  );

  const opisContent = description ? (
    <div className="space-y-4 whitespace-pre-line">{description}</div>
  ) : (
    <p className="text-[#9E9B90]">{t("description.noDescription")}</p>
  );

  const tabs = [
    { label: t("description.tabDescription"), content: opisContent },
    { label: t("description.tabIngredients"), content: skladContent },
  ];

  return (
    <section className="font-taranka-body">
      <div className="flex items-center gap-12 border-b border-cream-300">
        {tabs.map((tab, i) => {
          const isActive = i === active;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActive(i)}
              className={`relative -mb-px pb-3 font-taranka-display text-[28px] font-extrabold uppercase tracking-wide transition-colors ${
                isActive ? "text-ink-900" : "text-[#9E9B90] hover:text-ink-900"
              }`}
            >
              {tab.label}
              <span
                className={`absolute inset-x-0 -bottom-px h-0.5 bg-brand-red-500 transition-transform duration-300 ${
                  isActive ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-6 text-base leading-[24px] text-[#2B2A29]">{tabs[active]?.content}</div>
    </section>
  );
}
