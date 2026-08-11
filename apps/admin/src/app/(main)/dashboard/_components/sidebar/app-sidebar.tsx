"use client";

import { useMemo } from "react";

import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Database,
  File,
  Search,
  Settings,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { hasPermission, permissionForPath } from "@repo/types/rbac";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { rootUser } from "@/data/users";
import { cn } from "@/lib/utils";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

function SidebarCollapseToggle({ className }: { className?: string }) {
  const { toggleSidebar, state, isMobile } = useSidebar();

  if (isMobile) return null;

  const isCollapsed = state === "collapsed";

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      className={cn(
        "absolute top-20 z-30 flex size-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground",
        "-right-3 group-data-[variant=floating]:-right-1 group-data-[variant=inset]:-right-1",
        className,
      )}
    >
      {isCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
    </button>
  );
}

const _data = {
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: CircleHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: Database,
    },
    {
      name: "Reports",
      url: "#",
      icon: ClipboardList,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: File,
    },
  ],
};

export function AppSidebar({
  userRole,
  ...props
}: React.ComponentProps<typeof Sidebar> & { userRole?: string }) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.sidebarVariant,
      sidebarCollapsible: s.sidebarCollapsible,
      isSynced: s.isSynced,
    })),
  );

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  // Only show nav items the current role has permission for. Derived from the
  // same route→permission map the middleware uses, so visibility and access
  // control never drift. Items with no mapped permission (template demos) stay.
  const visibleItems = useMemo(
    () =>
      sidebarItems
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => {
            const required = permissionForPath(item.url);
            return !required || hasPermission(userRole, required);
          }),
        }))
        .filter((group) => group.items.length > 0),
    [userRole],
  );

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarCollapseToggle />
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* Logo sits on a dark plate so it keeps its natural (cream) colors
                in both light and dark themes. Centered when the sidebar is open. */}
            <Link
              prefetch={false}
              href="/dashboard"
              aria-label={APP_CONFIG.name}
              className="flex w-full items-center justify-center py-1"
            >
              <span className="flex w-full items-center justify-center rounded-xl bg-[#272423] px-4 py-2.5 shadow-sm group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:p-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/taranka-logo.svg"
                  alt={APP_CONFIG.name}
                  className="h-8 w-auto object-contain group-data-[collapsible=icon]:hidden"
                />
                {/* Compact mark for the collapsed icon rail */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/taranka-logo.svg"
                  alt={APP_CONFIG.name}
                  className="hidden size-6 object-contain group-data-[collapsible=icon]:block"
                />
              </span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={visibleItems} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={rootUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
