"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useTranslation } from "react-i18next";
import { Bell, CheckCheck, Package, Truck, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Notification } from "@repo/types";

// Map the domain event type → an i18n label key + an icon.
const KIND_KEY: Record<string, string> = {
  "order.created": "orderCreated",
  "order.shipped": "orderShipped",
  "inventory.lowStock": "lowStock",
};

function iconFor(type: string) {
  if (type === "order.created") return Package;
  if (type === "order.shipped") return Truck;
  if (type === "inventory.lowStock") return AlertTriangle;
  return Bell;
}

const levelDot: Record<string, string> = {
  success: "bg-green-500",
  info: "bg-blue-500",
  warning: "bg-amber-500",
};

export function NotificationsSheet() {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadCount = useCallback(async () => {
    try {
      const token = (await getToken()) || undefined;
      const res = await api.notifications.unreadCount(token);
      setUnread(res.data?.count ?? 0);
    } catch {
      // ignore — bell is non-critical
    }
  }, [getToken]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const token = (await getToken()) || undefined;
      const res = await api.notifications.list({ limit: 30, token });
      setItems(res.data ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // Poll the unread count in the background.
  useEffect(() => {
    loadCount();
    const id = setInterval(loadCount, 30_000);
    return () => clearInterval(id);
  }, [loadCount]);

  // Refresh the list whenever the sheet opens.
  useEffect(() => {
    if (open) loadList();
  }, [open, loadList]);

  const handleOpenItem = async (n: Notification) => {
    if (!n.read) {
      try {
        const token = (await getToken()) || undefined;
        await api.notifications.markRead(n.id, token);
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        setUnread((u) => Math.max(0, u - 1));
      } catch {
        // ignore
      }
    }
    if (n.orderId) {
      setOpen(false);
      router.push(`/dashboard/orders/${n.orderId}`);
    }
  };

  const handleMarkAll = async () => {
    try {
      const token = (await getToken()) || undefined;
      await api.notifications.markAllRead(token);
      setItems((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnread(0);
    } catch {
      // ignore
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" aria-label={t("notifications.title")} className="relative">
          <Bell />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 font-semibold text-[10px] text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="flex-row items-center justify-between space-y-0 border-b px-4 py-3">
          <SheetTitle>{t("notifications.title")}</SheetTitle>
          {items.some((i) => !i.read) && (
            <Button variant="ghost" size="sm" className="mr-6 h-8 gap-1.5 text-xs" onClick={handleMarkAll}>
              <CheckCheck className="size-3.5" />
              {t("notifications.markAllRead")}
            </Button>
          )}
        </SheetHeader>
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
              {t("notifications.empty")}
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const Icon = iconFor(n.type);
                const kind = KIND_KEY[n.type];
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenItem(n)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                        !n.read && "bg-primary/5",
                      )}
                    >
                      <span className="relative mt-0.5 shrink-0">
                        <Icon className="size-4 text-muted-foreground" />
                        {!n.read && (
                          <span
                            className={cn(
                              "absolute -top-1 -right-1 size-2 rounded-full",
                              levelDot[n.level] ?? "bg-blue-500",
                            )}
                          />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-medium text-foreground">
                            {kind ? t(`notifications.kind.${kind}`) : n.type}
                          </span>{" "}
                          <span className="text-muted-foreground">{n.title}</span>
                        </p>
                        {n.body && <p className="truncate text-muted-foreground text-xs">{n.body}</p>}
                        <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
