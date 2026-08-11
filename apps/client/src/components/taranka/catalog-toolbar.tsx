"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

const sortOptions: { label: string; value: string }[] = [
  { label: "Według ceny", value: "price-asc" },
  { label: "Według nazwy", value: "name-asc" },
  { label: "Według popularności", value: "popular" },
  { label: "Nowości", value: "newest" },
];

const DEFAULT_SORT = { label: "Nowości", value: "newest" };

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selected = sortOptions.find((o) => o.value === sort) ?? DEFAULT_SORT;

  const applySort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") params.delete("sort");
    else params.set("sort", value);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setOpen(false);
  };

  return (
    <div className="flex items-center justify-between font-taranka-body">
      <p className="text-sm text-ink-900">
        Pokazano <span className="font-medium">{shown}</span> pozycji z{" "}
        <span className="font-medium">{total}</span>
      </p>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex h-12 w-[212px] items-center justify-between rounded-full border border-[#B5B2A7] px-5 text-sm text-ink-900 transition-colors hover:border-ink-900"
        >
          <span className="text-[#9E9B90]">Sort:</span>
          <span>{selected.label}</span>
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
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
