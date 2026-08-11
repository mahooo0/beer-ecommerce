"use client";

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";

// Notifications are intentionally disabled for now (no backend wired up yet).
// The bell stays visible but greyed out and non-clickable.
export function NotificationsSheet() {
  return (
    <Button
      size="icon"
      variant="ghost"
      disabled
      aria-label="Notifications (disabled)"
      title="Notifications (coming soon)"
      className="cursor-not-allowed opacity-50"
    >
      <Bell />
    </Button>
  );
}
