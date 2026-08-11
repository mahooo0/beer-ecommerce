"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface SidebarCategory {
  name: string;
  slug: string;
  count?: number;
}

const buildHref = (slug?: string) =>
  slug ? `/products?category=${encodeURIComponent(slug)}` : "/products";

export function CatalogSidebar({
  categories = [],
  activeSlug,
  title,
}: {
  categories?: SidebarCategory[];
  activeSlug?: string;
  title?: string;
}) {
  const { t } = useTranslation("catalog");
  const heading = title ?? t("sidebar.categories");
  return (
    <aside className="w-[282px] shrink-0 font-taranka-body">
      <div className="rounded-2xl bg-[#E2DFD4] p-6">
        <h3 className="text-base font-semibold text-ink-900">{heading}</h3>
        <ul className="mt-4 space-y-3">
          <li>
            <Link
              href="/products"
              className={`group flex w-full items-center gap-4 text-left text-base ${
                !activeSlug ? "text-brand-red-500" : "text-ink-900"
              }`}
            >
              <span
                className={`flex size-[15px] shrink-0 items-center justify-center rounded-[3.5px] border transition-colors ${
                  !activeSlug
                    ? "border-brand-red-500 bg-brand-red-500"
                    : "border-[#B5B2A7] bg-transparent group-hover:border-ink-900"
                }`}
              >
                {!activeSlug && <Check className="size-3 text-cream-50" strokeWidth={3} />}
              </span>
              <span className="transition-colors group-hover:text-brand-red-500">{t("sidebar.all")}</span>
            </Link>
          </li>
          {categories.map((cat) => {
            const active = cat.slug === activeSlug;
            return (
              <li key={cat.slug}>
                <Link
                  href={buildHref(cat.slug)}
                  className={`group flex w-full items-center gap-4 text-left text-base ${
                    active ? "text-brand-red-500" : "text-ink-900"
                  }`}
                >
                  <span
                    className={`flex size-[15px] shrink-0 items-center justify-center rounded-[3.5px] border transition-colors ${
                      active
                        ? "border-brand-red-500 bg-brand-red-500"
                        : "border-[#B5B2A7] bg-transparent group-hover:border-ink-900"
                    }`}
                  >
                    {active && <Check className="size-3 text-cream-50" strokeWidth={3} />}
                  </span>
                  <span className="flex-1 transition-colors group-hover:text-brand-red-500">
                    {cat.name}
                  </span>
                  {typeof cat.count === "number" && (
                    <span className="text-sm text-[#9E9B90]">{cat.count}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
