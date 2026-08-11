"use client";

import * as React from "react";

import { AnimatePresence, motion } from "motion/react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
  SidebarMenu as BaseSidebarMenu,
  SidebarMenuButton as BaseSidebarMenuButton,
  SidebarMenuSubButton as BaseSidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// animate-ui style sidebar: the shadcn sidebar with a single motion "highlight"
// per menu that slides between whichever button is hovered, instead of each
// button flipping its own background on/off. Everything else (RBAC, i18n,
// collapsible groups, active states) is untouched — this only overrides how the
// hover affordance is drawn. Non-animated parts are re-exported verbatim so the
// module is a drop-in for `@/components/ui/sidebar`.
// ---------------------------------------------------------------------------

type HighlightRect = { top: number; left: number; width: number; height: number };

type SidebarMenuHoverContextValue = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  moveTo: (el: HTMLElement | null) => void;
};

const SidebarMenuHoverContext = React.createContext<SidebarMenuHoverContextValue | null>(null);

function SidebarMenu({ className, children, ...props }: React.ComponentProps<typeof BaseSidebarMenu>) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [rect, setRect] = React.useState<HighlightRect | null>(null);

  const moveTo = React.useCallback((el: HTMLElement | null) => {
    const container = containerRef.current;
    if (!el || !container) {
      setRect(null);
      return;
    }
    const c = container.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    setRect({ top: b.top - c.top, left: b.left - c.left, width: b.width, height: b.height });
  }, []);

  const value = React.useMemo(() => ({ containerRef, moveTo }), [moveTo]);

  return (
    <SidebarMenuHoverContext.Provider value={value}>
      <div ref={containerRef} className="relative">
        <AnimatePresence>
          {rect && (
            <motion.div
              key="sidebar-hover-highlight"
              aria-hidden
              className="pointer-events-none absolute rounded-md bg-sidebar-accent"
              // Position is in `initial` too, so the first hover fades in on the
              // target button instead of sliding in from the corner; moves after
              // that keep the element mounted and spring between positions.
              initial={{ opacity: 0, top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
              animate={{ opacity: 1, top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 0.15 },
                default: { type: "spring", stiffness: 500, damping: 40, mass: 0.8 },
              }}
            />
          )}
        </AnimatePresence>
        <BaseSidebarMenu className={className} {...props}>
          {children}
        </BaseSidebarMenu>
      </div>
    </SidebarMenuHoverContext.Provider>
  );
}

function SidebarMenuButton({
  className,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<typeof BaseSidebarMenuButton>) {
  const ctx = React.useContext(SidebarMenuHoverContext);

  return (
    <BaseSidebarMenuButton
      // Sit above the sliding highlight and drop the built-in hover background —
      // the highlight is the hover affordance now. Active/focus styles stay.
      className={cn("relative z-10 hover:bg-transparent", className)}
      onMouseEnter={(e) => {
        ctx?.moveTo(e.currentTarget);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        ctx?.moveTo(null);
        onMouseLeave?.(e);
      }}
      onFocus={(e) => {
        ctx?.moveTo(e.currentTarget);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        ctx?.moveTo(null);
        onBlur?.(e);
      }}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  BaseSidebarMenuSubButton as SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
