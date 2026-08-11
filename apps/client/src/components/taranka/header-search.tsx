"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

/**
 * Header search. Submits to the working catalog search (`/products?search=`),
 * which the server resolves via a name match. Kept as a small client island so
 * the header itself stays a server component.
 */
export function HeaderSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/products?search=${encodeURIComponent(term)}` : "/products");
  };

  return (
    <form
      onSubmit={submit}
      role="search"
      className="flex h-full items-center bg-cream-200 px-5 w-[252px]"
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Szukaj produktów…"
        aria-label="Szukaj produktów"
        className="h-full flex-1 bg-transparent text-sm text-ink-900 placeholder:text-cream-400 outline-none"
      />
      <button
        type="submit"
        aria-label="Szukaj"
        className="text-ink-900 transition-colors hover:text-brand-red-500"
      >
        <Search className="size-5" strokeWidth={1.75} />
      </button>
    </form>
  );
}
