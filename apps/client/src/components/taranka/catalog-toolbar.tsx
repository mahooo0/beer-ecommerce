"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFilters } from "@/hooks/use-filters";

const sortOptions: { key: string; value: string }[] = [
  { key: "price", value: "price-asc" },
  { key: "name", value: "name-asc" },
  { key: "popular", value: "popular" },
  { key: "newest", value: "newest" },
];

const DEFAULT_SORT = { key: "newest", value: "newest" };

export function CatalogToolbar({
  shown,
  total,
  sort = "newest",
}: {
  shown: number;
  total: number;
  sort?: string;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation("catalog");
  const [, setFilters] = useFilters();

  // Read the active sort from the SSR-provided prop (no hydration flicker);
  // write changes through nuqs so the server re-fetches (shallow:false). The
  // 'newest' default is cleared from the URL by nuqs' clearOnDefault.
  const selected = sortOptions.find((o) => o.value === sort) ?? DEFAULT_SORT;

  const applySort = (value: string) => {
    setFilters({ sort: value, page: 1 });
    setOpen(false);
  };

  return (
    <div className="flex items-center justify-between font-taranka-body">
      <p className="text-sm text-ink-900">
        {t("toolbar.showingPrefix")} <span className="font-medium">{shown}</span>{" "}
        {t("toolbar.showingOf")} <span className="font-medium">{total}</span>
      </p>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex h-12 w-[212px] items-center justify-between rounded-full border border-[#B5B2A7] px-5 text-sm text-ink-900 transition-colors hover:border-ink-900"
        >
          <span className="text-[#9E9B90]">{t("toolbar.sortLabel")}</span>
          <span>{t(`toolbar.sort.${selected.key}`)}</span>
          <ChevronDown
            className={`size-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            strokeWidth={1.75}
          />
        </button>
        {open && (
          <ul className="absolute right-0 top-full z-20 mt-2 w-[212px] overflow-hidden rounded-2xl border border-[#B5B2A7] bg-white py-1 shadow-lg">
            {sortOptions.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => applySort(opt.value)}
                  className={`block w-full px-5 py-2 text-left text-sm transition-colors hover:bg-cream-200 ${
                    opt.value === selected.value ? "text-brand-red-500" : "text-ink-900"
                  }`}
                >
                  {t(`toolbar.sort.${opt.key}`)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
