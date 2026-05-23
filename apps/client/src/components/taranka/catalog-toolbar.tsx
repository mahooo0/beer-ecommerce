"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const sortOptions = ["Według ceny", "Według nazwy", "Według popularności", "Nowości"];

export function CatalogToolbar({ shown, total }: { shown: number; total: number }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(sortOptions[0]);

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
          <span>{selected}</span>
          <ChevronDown
            className={`size-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            strokeWidth={1.75}
          />
        </button>
        {open && (
          <ul className="absolute right-0 top-full z-20 mt-2 w-[212px] overflow-hidden rounded-2xl border border-[#B5B2A7] bg-white py-1 shadow-lg">
            {sortOptions.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(opt);
                    setOpen(false);
                  }}
                  className={`block w-full px-5 py-2 text-left text-sm transition-colors hover:bg-cream-200 ${
                    opt === selected ? "text-brand-red-500" : "text-ink-900"
                  }`}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
