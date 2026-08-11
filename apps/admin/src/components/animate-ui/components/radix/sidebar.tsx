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
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
  SidebarMenu as BaseSidebarMenu,
  SidebarMenuButton as BaseSidebarMenuButton,
  SidebarMenuSub as BaseSidebarMenuSub,
  SidebarMenuSubButton as BaseSidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// animate-ui style sidebar: the shadcn sidebar with a single hover "highlight"
// per menu that slides between whichever button is hovered. The highlight is
// painted in the theme's selected primary color (`--sidebar-primary`, driven by
// the customizer's theme preset), so it follows whatever the user picked in
// settings. The same mechanism is applied to sub-menus, so it works inside the
// collapsible accordions (sub-pages) too. Everything else — RBAC, i18n,
// collapsible groups, active states — is untouched. Non-animated parts are
// re-exported verbatim so this stays a drop-in for `@/components/ui/sidebar`.
// ---------------------------------------------------------------------------

type HighlightRect = { top: number; left: number; width: number; height: number };

type HoverContextValue = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  moveTo: (el: HTMLElement | null) => void;
};

const HoverContext = React.createContext<HoverContextValue | null>(null);

/** Tracks the hovered button's geometry relative to the menu container. */
function useHoverHighlight() {
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

  return { containerRef, rect, moveTo };
}

/** The single primary-colored pill that springs between hovered items. */
function HoverHighlight({ rect, radiusClassName }: { rect: HighlightRect | null; radiusClassName?: string }) {
  return (
    <AnimatePresence>
      {rect && (
        <motion.div
          key="sidebar-hover-highlight"
          aria-hidden
          className={cn("pointer-events-none absolute bg-sidebar-primary", radiusClassName ?? "rounded-md")}
          // Gradient presets set `--sidebar-primary-gradient`; when they do the
          // pill is painted with it, otherwise it falls back to the solid
          // `bg-sidebar-primary` color (`none` disables the image layer).
          style={{ backgroundImage: "var(--sidebar-primary-gradient, none)" }}
          // Position is in `initial` too, so the first hover fades in on the
          // target button instead of sliding in from the corner; moves after
          // that keep the element mounted and spring between positions.
          initial={{ opacity: 0, top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          animate={{ opacity: 1, top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 0.12 },
            default: { type: "spring", stiffness: 650, damping: 45, mass: 0.7 },
          }}
        />
      )}
    </AnimatePresence>
  );
}

function SidebarMenu({ className, children, ...props }: React.ComponentProps<typeof BaseSidebarMenu>) {
  const { containerRef, rect, moveTo } = useHoverHighlight();
  return (
    <HoverContext.Provider value={{ containerRef, moveTo }}>
      <div ref={containerRef} className="relative">
        <HoverHighlight rect={rect} />
        <BaseSidebarMenu className={className} {...props}>
          {children}
        </BaseSidebarMenu>
      </div>
    </HoverContext.Provider>
  );
}

/** Same sliding highlight, scoped to one accordion's sub-page list. */
function SidebarMenuSub({ className, children, ...props }: React.ComponentProps<typeof BaseSidebarMenuSub>) {
  const { containerRef, rect, moveTo } = useHoverHighlight();
  return (
    <HoverContext.Provider value={{ containerRef, moveTo }}>
      <div ref={containerRef} className="relative">
        <HoverHighlight rect={rect} />
        <BaseSidebarMenuSub className={className} {...props}>
          {children}
        </BaseSidebarMenuSub>
      </div>
    </HoverContext.Provider>
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
  const ctx = React.useContext(HoverContext);

  return (
    <BaseSidebarMenuButton
      // Sit above the sliding highlight, drop the built-in hover background, and
      // read against the primary fill via its matching foreground token. Only
      // when there's a menu highlight to sit on — outside one (e.g. the
      // collapsed-rail dropdown) keep the base hover styling.
      className={cn(ctx && "relative z-10 hover:bg-transparent hover:text-sidebar-primary-foreground", className)}
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

function SidebarMenuSubButton({
  className,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<typeof BaseSidebarMenuSubButton>) {
  const ctx = React.useContext(HoverContext);

  return (
    <BaseSidebarMenuSubButton
      // Same as SidebarMenuButton: only take over the hover styling when this
      // sub-button lives inside an animated menu (not in the rail dropdown).
      className={cn(
        ctx &&
          "relative z-10 hover:bg-transparent hover:text-sidebar-primary-foreground hover:[&>svg]:text-sidebar-primary-foreground",
        className,
      )}
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
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
