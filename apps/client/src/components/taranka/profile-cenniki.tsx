"use client";

import { useState } from "react";
import { Search, Eye, FileDown } from "lucide-react";
import { Input } from "@/components/shadcn/input";

const all = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  date: "21.07.2024",
}));

export function ProfileCenniki() {
  const [query, setQuery] = useState("");

  const filtered = all.filter((c) =>
    c.date.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex-1 rounded-[20px] bg-white p-8 font-taranka-body">
      <div className="flex items-center justify-between gap-6">
        <h1 className="font-taranka-display text-2xl font-extrabold uppercase tracking-wide text-ink-900">
          Cenniki
        </h1>

        <div className="relative w-[240px]">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="wyszukiwanie daty"
            className="h-9 rounded-full border-[#B5B2A7] bg-white pl-5 pr-10 text-sm text-ink-900 shadow-none placeholder:text-brand-red-500 placeholder:underline placeholder:underline-offset-2 focus-visible:border-ink-900 focus-visible:ring-0"
          />
          <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#9E9B90]" strokeWidth={1.75} />
        </div>
      </div>

      <ul className="mt-10 grid grid-cols-3 gap-x-6 gap-y-4">
        {filtered.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between gap-4 text-base text-ink-900"
          >
            <button
              type="button"
              className="underline underline-offset-2 transition-colors hover:text-brand-red-500"
            >
              Cennik {c.date}
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Podgląd cennika"
                className="text-ink-900 transition-colors hover:text-brand-red-500"
              >
                <Eye className="size-5" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                aria-label="Pobierz cennik"
                className="text-ink-900 transition-colors hover:text-brand-red-500"
              >
                <FileDown className="size-5" strokeWidth={1.75} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-sm text-[#9E9B90]">
          Brak cenników pasujących do wyszukiwania.
        </p>
      )}
    </div>
  );
}
