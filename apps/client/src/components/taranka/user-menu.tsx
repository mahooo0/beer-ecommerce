"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, ShoppingBag, UserCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { Separator } from "@/components/shadcn/separator";
import { useAuth } from "@/lib/auth-store";
import { useState } from "react";

export function UserMenu() {
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <Link
        href="/sign-in"
        aria-label="Zaloguj się"
        className="group/icon flex h-full w-12 items-center justify-center text-ink-900 transition-colors hover:text-brand-red-500"
      >
        <User
          className="size-5 transition-transform duration-300 group-hover/icon:scale-110"
          strokeWidth={1.75}
        />
      </Link>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Profil"
          className="group/icon flex h-full w-12 items-center justify-center text-ink-900 transition-colors hover:text-brand-red-500"
        >
          <User
            className="size-5 transition-transform duration-300 group-hover/icon:scale-110"
            strokeWidth={1.75}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={12}
        className="w-[260px] rounded-2xl border-0 bg-white p-0 font-taranka-body shadow-[0_20px_50px_-12px_rgba(39,36,34,0.25)]"
      >
        <div className="p-4">
          <p className="font-taranka-display text-base font-extrabold uppercase tracking-wide text-ink-900">
            {user.name ?? "Konto"}
          </p>
          <p className="mt-1 text-sm text-[#9E9B90]">{user.email}</p>
        </div>
        <Separator />
        <nav className="flex flex-col p-2">
          <MenuLink href="/profile" icon={UserCircle} onClick={() => setOpen(false)}>
            Profil
          </MenuLink>
          <MenuLink href="/orders" icon={ShoppingBag} onClick={() => setOpen(false)}>
            Zamówienia
          </MenuLink>
        </nav>
        <Separator />
        <button
          type="button"
          onClick={() => {
            signOut();
            setOpen(false);
            router.push("/");
          }}
          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-ink-900 transition-colors hover:bg-cream-200 hover:text-brand-red-500"
        >
          <LogOut className="size-4" strokeWidth={1.75} />
          Wyloguj się
        </button>
      </PopoverContent>
    </Popover>
  );
}

function MenuLink({
  href,
  icon: Icon,
  onClick,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-900 transition-colors hover:bg-cream-200 hover:text-brand-red-500"
    >
      <Icon className="size-4" strokeWidth={1.75} />
      {children}
    </Link>
  );
}
