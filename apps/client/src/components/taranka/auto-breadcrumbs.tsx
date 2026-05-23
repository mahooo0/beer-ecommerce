"use client";

import { usePathname } from "next/navigation";
import { Breadcrumbs } from "./breadcrumbs";

const labels: Record<string, string> = {
  products: "Katalog",
  cart: "Koszyk",
  checkout: "Zamówienie",
  success: "Potwierdzenie",
  wishlist: "Ulubione",
  profile: "Profil",
  orders: "Zamówienia",
  compare: "Porównanie",
  categories: "Kategorie",
  search: "Wyszukiwanie",
  "sign-in": "Zaloguj się",
  "sign-up": "Rejestracja",
  addresses: "Twoje adresy",
  cenniki: "Cenniki",
  znizki: "Twoje zniżki",
};

const decodeSegment = (seg: string) =>
  labels[seg] ?? decodeURIComponent(seg).replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

export function AutoBreadcrumbs() {
  const pathname = usePathname();
  if (!pathname || pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);

  const items = [
    { label: "Strona główna", href: "/" },
    ...segments.map((seg, i) => {
      const isLast = i === segments.length - 1;
      const href = "/" + segments.slice(0, i + 1).join("/");
      return { label: decodeSegment(seg), href: isLast ? undefined : href };
    }),
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-[120px] pt-8">
      <Breadcrumbs items={items} />
    </div>
  );
}
