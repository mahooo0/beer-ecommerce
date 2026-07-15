"use client";

import { useState } from "react";
import Link from "next/link";
import { User, UserRound, Settings, LogOut } from "lucide-react";
import { Show, useUser, useClerk } from "@clerk/nextjs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";

const menuItem =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-900 transition-colors hover:bg-[#F5F3EC]";

export function UserMenu() {
  return (
    <>
      <Show when="signed-out">
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
      </Show>

      <Show when="signed-in">
        <SignedInMenu />
      </Show>
    </>
  );
}

function SignedInMenu() {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const [open, setOpen] = useState(false);

  const customerType =
    (user?.publicMetadata?.customerType as string | undefined) ??
    (user?.unsafeMetadata?.customerType as string | undefined);
  const isWholesale = customerType === "WHOLESALE";

  const displayName =
    user?.fullName || user?.primaryEmailAddress?.emailAddress || "Konto";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  return (
    <div className="flex h-full w-12 items-center justify-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Konto"
            className="flex size-9 items-center justify-center overflow-hidden rounded-full ring-1 ring-cream-300 transition-transform hover:scale-105"
          >
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.imageUrl} alt="" className="size-full object-cover" />
            ) : (
              <User className="size-5 text-ink-900" strokeWidth={1.75} />
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          className="w-64 rounded-2xl border-cream-300 p-0 font-taranka-body shadow-lg"
        >
          {/* header */}
          <div className="flex items-center gap-3 border-b border-cream-300 p-4">
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.imageUrl}
                alt=""
                className="size-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-10 items-center justify-center rounded-full bg-cream-200">
                <User className="size-5 text-ink-900" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink-900">
                {displayName}
              </p>
              <span
                className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                  isWholesale
                    ? "bg-brand-red-500 text-cream-50"
                    : "bg-cream-200 text-ink-900"
                }`}
              >
                {isWholesale ? "Dostawca" : "Klient detaliczny"}
              </span>
            </div>
          </div>

          {/* actions */}
          <div className="p-2">
            <Link href="/profile" onClick={() => setOpen(false)} className={menuItem}>
              <UserRound className="size-4" strokeWidth={1.75} />
              Profil
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openUserProfile();
              }}
              className={menuItem}
            >
              <Settings className="size-4" strokeWidth={1.75} />
              Menedżer konta
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void signOut({ redirectUrl: "/" });
              }}
              className={`${menuItem} text-brand-red-500 hover:bg-brand-red-500/10`}
            >
              <LogOut className="size-4" strokeWidth={1.75} />
              Wyloguj
            </button>
          </div>
          {email && (
            <p className="truncate border-t border-cream-300 px-4 py-2 text-xs text-ink-900/60">
              {email}
            </p>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
