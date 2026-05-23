"use client";

import { ShoppingCart } from "lucide-react";
import { forwardRef } from "react";
import { useCart } from "@/lib/cart-store";

export const CartTrigger = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  function CartTrigger(props, ref) {
    const count = useCart((s) => s.items.reduce((sum, it) => sum + it.qty, 0));

    return (
      <button
        ref={ref}
        type="button"
        aria-label="Koszyk"
        {...props}
        className="group/icon relative flex h-full w-12 items-center justify-center text-ink-900 transition-colors hover:text-brand-red-500"
      >
        <ShoppingCart
          className="size-5 transition-transform duration-300 group-hover/icon:scale-110"
          strokeWidth={1.75}
        />
        {count > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-red-500 px-1 text-[10px] font-bold leading-none text-cream-50">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
    );
  }
);
