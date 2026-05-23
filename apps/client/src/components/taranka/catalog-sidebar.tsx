"use client";

import { useState } from "react";
import { Check } from "lucide-react";

const groupItems = [
  "Spożywcze artykuły",
  "Spożywcze artykuły",
  "Spożywcze artykuły",
  "Spożywcze artykuły",
  "Spożywcze artykuły",
  "Spożywcze artykuły",
];

const pillCategories = ["Ryba", "Ryba", "Ryba", "Ryba"];

export function CatalogSidebar() {
  const [checked, setChecked] = useState<boolean[]>(() => groupItems.map(() => false));

  return (
    <aside className="w-[282px] shrink-0 font-taranka-body">
      <div className="rounded-2xl bg-[#E2DFD4] p-6">
        <h3 className="text-base font-semibold text-ink-900">Spożywcze artykuły</h3>
        <ul className="mt-4 space-y-3">
          {groupItems.map((label, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setChecked((c) => c.map((v, idx) => (idx === i ? !v : v)))}
                className="group flex w-full items-center gap-4 text-left text-base text-ink-900"
              >
                <span
                  className={`flex size-[15px] shrink-0 items-center justify-center rounded-[3.5px] border transition-colors ${
                    checked[i]
                      ? "border-brand-red-500 bg-brand-red-500"
                      : "border-[#B5B2A7] bg-transparent group-hover:border-ink-900"
                  }`}
                >
                  {checked[i] && <Check className="size-3 text-cream-50" strokeWidth={3} />}
                </span>
                <span className="transition-colors group-hover:text-brand-red-500">{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-2 space-y-2">
        {pillCategories.map((label, i) => (
          <button
            key={i}
            type="button"
            className="flex h-12 w-full items-center rounded-2xl bg-[#E2DFD4] px-[35px] text-base font-semibold text-ink-900 transition-colors hover:bg-[#cfccbf]"
          >
            {label}
          </button>
        ))}
      </div>
    </aside>
  );
}
