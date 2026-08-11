"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Award, FolderTree, Layers, type LucideIcon, PackagePlus, PlusCircle, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

type QuickAction = { labelKey: string; url: string; icon: LucideIcon };

// Curated "create" shortcuts. Product has a dedicated /new route; the others
// jump to their list page where the add sheet/button lives.
const quickActions: QuickAction[] = [
  { labelKey: "quickCreate.actions.product", url: "/dashboard/products/new", icon: PackagePlus },
  { labelKey: "quickCreate.actions.category", url: "/dashboard/categories", icon: FolderTree },
  { labelKey: "quickCreate.actions.collection", url: "/dashboard/collections", icon: Layers },
  { labelKey: "quickCreate.actions.brand", url: "/dashboard/brands", icon: Award },
  { labelKey: "quickCreate.actions.user", url: "/dashboard/users", icon: Users },
];

export function QuickActions() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  // ⌘K / Ctrl+K opens the quick actions palette, mirroring the ⌘J search.
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const run = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={t("quickCreate.button")}
          onClick={() => setOpen(true)}
          className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
        >
          <PlusCircle />
          <span>{t("quickCreate.button")}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder={t("quickCreate.placeholder")} />
          <CommandList>
            <CommandEmpty>{t("common.noResults")}</CommandEmpty>
            <CommandGroup heading={t("quickCreate.createGroup")}>
              {quickActions.map((action) => (
                <CommandItem key={action.url} value={t(action.labelKey)} onSelect={() => run(action.url)}>
                  <action.icon />
                  <span>{t(action.labelKey)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </SidebarMenu>
  );
}
