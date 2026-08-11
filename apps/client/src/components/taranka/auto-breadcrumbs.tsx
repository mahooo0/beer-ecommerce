"use client";

import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Breadcrumbs } from "./breadcrumbs";

export function AutoBreadcrumbs() {
  const { t } = useTranslation("common");
  const pathname = usePathname();
  if (!pathname || pathname === "/") return null;

  const labels: Record<string, string> = {
    products: t("breadcrumbs.segments.products"),
    cart: t("breadcrumbs.segments.cart"),
    checkout: t("breadcrumbs.segments.checkout"),
    success: t("breadcrumbs.segments.success"),
    wishlist: t("breadcrumbs.segments.wishlist"),
    profile: t("breadcrumbs.segments.profile"),
    orders: t("breadcrumbs.segments.orders"),
    compare: t("breadcrumbs.segments.compare"),
    categories: t("breadcrumbs.segments.categories"),
    search: t("breadcrumbs.segments.search"),
    "sign-in": t("breadcrumbs.segments.signIn"),
    "sign-up": t("breadcrumbs.segments.signUp"),
    addresses: t("breadcrumbs.segments.addresses"),
    cenniki: t("breadcrumbs.segments.cenniki"),
    znizki: t("breadcrumbs.segments.znizki"),
  };

  const decodeSegment = (seg: string) =>
    labels[seg] ?? decodeURIComponent(seg).replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

  const segments = pathname.split("/").filter(Boolean);

  const items = [
    { label: t("breadcrumbs.home"), href: "/" },
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
