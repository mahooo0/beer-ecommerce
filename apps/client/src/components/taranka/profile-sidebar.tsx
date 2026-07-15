"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; wholesaleOnly?: boolean };

const navItems: NavItem[] = [
  { label: "Dane osobowe", href: "/profile" },
  { label: "Twoje adresy", href: "/profile/addresses" },
  { label: "Cenniki", href: "/profile/cenniki", wholesaleOnly: true },
  { label: "Historia zamówień", href: "/orders" },
  { label: "Ulubione", href: "/wishlist" },
  { label: "Twoje zniżki", href: "/profile/znizki" },
];

export function ProfileSidebar() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();

  // customerType is set in unsafeMetadata at sign-up and promoted to
  // publicMetadata by the server webhook — read either so it shows immediately.
  const customerType =
    (user?.publicMetadata?.customerType as string | undefined) ??
    (user?.unsafeMetadata?.customerType as string | undefined);
  const isWholesale = customerType === "WHOLESALE";

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const visibleItems = navItems.filter(
    (item) => !item.wholesaleOnly || isWholesale
  );

  return (
    <aside className="flex h-fit min-h-[450px] w-[280px] shrink-0 flex-col rounded-[20px] bg-[#D6D3C8] p-6 font-taranka-body">
      <span
        className={cn(
          "mb-4 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
          isWholesale
            ? "bg-brand-red-500 text-cream-50"
            : "bg-white text-ink-900"
        )}
      >
        {isWholesale ? "Dostawca" : "Klient detaliczny"}
      </span>

      <nav className="flex flex-col gap-2">
        {visibleItems.map((item) => {
          const active =
            item.href === pathname ||
            (item.href !== "/profile" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-2 py-2 text-base transition-colors ${
                active
                  ? "font-semibold text-brand-red-500"
                  : "text-ink-900 hover:text-brand-red-500"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-auto inline-flex items-center gap-3 px-2 pt-6 text-base text-ink-900 transition-colors hover:text-brand-red-500"
      >
        <LogOut className="size-5" strokeWidth={1.75} />
        Wylogowanie z konta
      </button>
    </aside>
  );
}
