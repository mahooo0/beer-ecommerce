"use client";

import { AnalyticsEventType, type AnalyticsEventType as AnalyticsEventTypeT } from "@repo/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const SID_KEY = "taranka-sid";

/**
 * Anonymous, best-effort behavioral tracking for the storefront funnel +
 * abandoned-cart analytics. NOT a security or consent boundary — it only
 * records shopping intent. Every call is fire-and-forget: failures are
 * swallowed so tracking can never interrupt the shopper.
 */

export { AnalyticsEventType };

// Signed-in identity, kept in a module-level slot so non-React call sites (the
// zustand cart store) can attribute events. Set once from a React sync island.
let identity: { userId?: string | null; isWholesale?: boolean } = {};

export function setAnalyticsIdentity(next: { userId?: string | null; isWholesale?: boolean }): void {
  identity = { ...identity, ...next };
}

/** Stable anonymous browser id. Survives reloads via localStorage. */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let sid = window.localStorage.getItem(SID_KEY);
    if (!sid) {
      sid =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    return "";
  }
}

interface TrackPayload {
  productId?: string;
  quantity?: number;
  itemCount?: number;
  valueCents?: number;
  query?: string;
  orderId?: string;
  email?: string;
  userId?: string | null;
  isWholesale?: boolean;
  meta?: Record<string, unknown>;
}

/** Record one funnel event. Fire-and-forget; never throws into the UI. */
export function track(type: AnalyticsEventTypeT, payload: TrackPayload = {}): void {
  if (typeof window === "undefined") return;
  const sessionId = getSessionId();
  if (!sessionId) return;

  const body = JSON.stringify({
    type,
    sessionId,
    userId: payload.userId ?? identity.userId ?? null,
    isWholesale: payload.isWholesale ?? identity.isWholesale ?? false,
    ...payload,
  });

  try {
    void fetch(`${API_URL}/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true, // survives navigation / tab close for checkout beacons
    }).catch(() => {});
  } catch {
    // ignore — analytics must never break the shopper's flow
  }
}
