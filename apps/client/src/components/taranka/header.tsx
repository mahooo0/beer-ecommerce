import Link from "next/link";
import {
  MapPin,
  ChevronDown,
  LayoutGrid,
  Search,
  Heart,
} from "lucide-react";
import { MiniCart } from "./mini-cart";
import { CartTrigger } from "./cart-trigger";
import { UserMenu } from "./user-menu";

const navLinks = [
  { label: "Sugestie", href: "#" },
  { label: "O nas", href: "#" },
  { label: "Dostawa i płatność", href: "#" },
  { label: "Franczyza", href: "#" },
  { label: "Kontakt", href: "#" },
];

export function TarankaHeader() {
  return (
    <header className="sticky top-0 z-[1000] font-taranka-body shadow-sm backdrop-blur-sm">
      <div className="flex h-14 items-center bg-ink-900 px-9 text-cream-50">
        <div className="flex flex-1 items-center gap-1">
          <MapPin className="size-4" strokeWidth={1.75} />
          <span className="text-sm font-normal">ul. Sagaidachnego 5, Warszawa</span>
        </div>

        <Link href="/" className="flex items-center" aria-label="Taranka">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/taranka-logo.svg"
            alt="Taranka"
            width={123}
            height={48}
            className="h-12 w-auto"
          />
        </Link>

        <div className="flex flex-1 items-center justify-end">
          <button
            type="button"
            className="group flex items-center gap-1 text-sm font-medium text-cream-50 transition-colors hover:text-brand-red-500"
          >
            PL
            <ChevronDown
              className="size-4 transition-transform duration-300 group-hover:rotate-180"
              strokeWidth={1.75}
            />
          </button>
        </div>
      </div>

      <div className="flex h-12 items-center gap-9 border-b border-cream-300 bg-background px-9">
        <Link
          href="/products"
          className="group inline-flex h-10 w-[178px] items-center justify-center gap-1 font-taranka-ui text-base font-medium text-ink-900 transition-colors hover:text-brand-red-500"
        >
          <LayoutGrid
            className="size-6 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"
            strokeWidth={1.75}
          />
          Katalog
        </Link>

        <nav className="flex items-center gap-9">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="relative text-base font-normal text-ink-900 transition-colors duration-300 hover:text-brand-red-500 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-brand-red-500 after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex h-full items-center">
          <div className="h-full w-px bg-cream-300" />

          <div className="flex h-full items-center bg-cream-200 px-5 w-[252px]">
            <input
              type="search"
              placeholder=""
              className="h-full flex-1 bg-transparent text-sm text-ink-900 placeholder:text-cream-400 outline-none"
            />
            <Search className="size-5 text-ink-900" strokeWidth={1.75} />
          </div>

          <UserMenu />
          <div className="h-full w-px bg-cream-300" />

          <button
            type="button"
            aria-label="Ulubione"
            className="group/icon flex h-full w-12 items-center justify-center text-ink-900 transition-colors hover:text-brand-red-500"
          >
            <Heart className="size-5 transition-transform duration-300 group-hover/icon:scale-110" strokeWidth={1.75} />
          </button>
          <div className="h-full w-px bg-cream-300" />

          <MiniCart trigger={<CartTrigger />} />
          <div className="h-full w-px bg-cream-300" />
        </div>
      </div>
    </header>
  );
}
