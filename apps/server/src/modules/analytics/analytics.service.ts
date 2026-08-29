import { prisma } from '@repo/db';
import {
  AnalyticsEventType,
  type AnalyticsTrackInput,
  type CartAnalyticsSummary,
  type AbandonedCartRow,
} from '@repo/types';
import { AppError } from '../../common/middleware/error-handler.js';

const VALID_TYPES = new Set<string>(Object.values(AnalyticsEventType));

/** Coerce to a non-negative integer, or undefined when absent/invalid. */
function toInt(v: unknown): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(0, n) : undefined;
}

function toStr(v: unknown, max = 512): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s ? s.slice(0, max) : undefined;
}

interface SummaryParams {
  from?: string;
  to?: string;
  checkoutWindowMin?: number; // minutes with no paid order → abandoned checkout
  cartWindowHours?: number; // hours with no checkout/order → abandoned cart
}

/** Minimal event shape the abandonment classifier needs. */
export interface FlowEvent {
  type: string;
  sessionId: string;
  userId: string | null;
  email: string | null;
  itemCount: number | null;
  valueCents: number | null;
  createdAt: Date;
}

/**
 * Two-stage abandonment classification (pure — no I/O, so it's directly
 * unit-testable). Events must be sorted oldest-first. Per session:
 *  - Converted (any `purchased`) → excluded.
 *  - Reached `checkout_started`, no purchase, checkout older than the checkout
 *    window → **abandoned checkout** (takes precedence).
 *  - Otherwise had cart items, never reached checkout, last cart activity older
 *    than the cart window → **abandoned cart**.
 * Rows come back sorted by value (highest first) so the recovery list leads
 * with the most valuable opportunities.
 */
export function classifyAbandonment(
  events: FlowEvent[],
  opts: { now: number; checkoutWindowMs: number; cartWindowMs: number },
): { abandonedCheckoutRows: AbandonedCartRow[]; abandonedCartRows: AbandonedCartRow[] } {
  interface SessionRoll {
    userId: string | null;
    email: string | null;
    lastCartAt: Date | null;
    cartItemCount: number;
    cartValueCents: number;
    checkoutAt: Date | null;
    checkoutValueCents: number;
    checkoutEmail: string | null;
    purchasedAt: Date | null;
  }
  const bySession = new Map<string, SessionRoll>();
  for (const e of events) {
    let s = bySession.get(e.sessionId);
    if (!s) {
      s = {
        userId: null,
        email: null,
        lastCartAt: null,
        cartItemCount: 0,
        cartValueCents: 0,
        checkoutAt: null,
        checkoutValueCents: 0,
        checkoutEmail: null,
        purchasedAt: null,
      };
      bySession.set(e.sessionId, s);
    }
    if (e.userId) s.userId = e.userId;
    if (e.email) s.email = e.email;
    if (e.type === AnalyticsEventType.ADD_TO_CART || e.type === AnalyticsEventType.REMOVE_FROM_CART) {
      s.lastCartAt = e.createdAt;
      if (e.itemCount !== null) s.cartItemCount = e.itemCount;
      if (e.valueCents !== null) s.cartValueCents = e.valueCents;
    } else if (e.type === AnalyticsEventType.CHECKOUT_STARTED) {
      s.checkoutAt = e.createdAt;
      if (e.valueCents !== null) s.checkoutValueCents = e.valueCents;
      if (e.email) s.checkoutEmail = e.email;
    } else if (e.type === AnalyticsEventType.PURCHASED) {
      s.purchasedAt = e.createdAt;
    }
  }

  const abandonedCheckoutRows: AbandonedCartRow[] = [];
  const abandonedCartRows: AbandonedCartRow[] = [];
  for (const [sessionId, s] of bySession) {
    if (s.purchasedAt) continue; // converted → not abandoned

    // Reached checkout, never paid, and the checkout is older than the window.
    if (s.checkoutAt && opts.now - s.checkoutAt.getTime() > opts.checkoutWindowMs) {
      abandonedCheckoutRows.push({
        sessionId,
        userId: s.userId,
        email: s.checkoutEmail ?? s.email,
        itemCount: s.cartItemCount,
        valueCents: s.checkoutValueCents || s.cartValueCents,
        lastActivityAt: s.checkoutAt.toISOString(),
        reachedCheckout: true,
      });
      continue; // checkout abandonment takes precedence over cart abandonment
    }

    // Had items, never reached checkout, and the cart is older than the window.
    if (
      !s.checkoutAt &&
      s.lastCartAt &&
      s.cartItemCount > 0 &&
      opts.now - s.lastCartAt.getTime() > opts.cartWindowMs
    ) {
      abandonedCartRows.push({
        sessionId,
        userId: s.userId,
        email: s.email,
        itemCount: s.cartItemCount,
        valueCents: s.cartValueCents,
        lastActivityAt: s.lastCartAt.toISOString(),
        reachedCheckout: false,
      });
    }
  }

  const byValueDesc = (a: AbandonedCartRow, b: AbandonedCartRow) => b.valueCents - a.valueCents;
  abandonedCheckoutRows.sort(byValueDesc);
  abandonedCartRows.sort(byValueDesc);
  return { abandonedCheckoutRows, abandonedCartRows };
}

class AnalyticsService {
  /**
   * Record one behavioral event. Best-effort and non-authoritative: `userId` /
   * `sessionId` come straight from the client and are trusted only for
   * attribution, never as an auth signal. Invalid event types are rejected so
   * client bugs surface; everything else is coerced defensively.
   */
  async track(input: AnalyticsTrackInput) {
    const type = toStr(input?.type);
    const sessionId = toStr(input?.sessionId, 128);

    if (!type || !VALID_TYPES.has(type)) {
      throw new AppError(400, 'Invalid analytics event type');
    }
    if (!sessionId) {
      throw new AppError(400, 'Missing sessionId');
    }

    return prisma.analyticsEvent.create({
      data: {
        type,
        sessionId,
        userId: toStr(input.userId ?? undefined, 128) ?? null,
        isWholesale: Boolean(input.isWholesale),
        productId: toStr(input.productId, 128) ?? null,
        quantity: toInt(input.quantity) ?? null,
        itemCount: toInt(input.itemCount) ?? null,
        valueCents: toInt(input.valueCents) ?? null,
        query: toStr(input.query, 256) ?? null,
        orderId: toStr(input.orderId, 128) ?? null,
        email: toStr(input.email, 256) ?? null,
        meta: (input.meta as object | undefined) ?? undefined,
      },
    });
  }

  /**
   * Authoritative purchase marker, emitted server-side from `order.created`
   * (see analytics.events.ts) so conversion never depends on the browser
   * reaching the success page.
   */
  async recordPurchase(data: {
    sessionId?: string | null;
    userId?: string | null;
    orderId: string;
    valueCents: number;
    email?: string | null;
  }) {
    // No sessionId → the order predates client analytics wiring; still record
    // the purchase so revenue funnels stay honest, keyed by order id.
    const sessionId = toStr(data.sessionId ?? undefined, 128) ?? `order:${data.orderId}`;
    return prisma.analyticsEvent.create({
      data: {
        type: AnalyticsEventType.PURCHASED,
        sessionId,
        userId: toStr(data.userId ?? undefined, 128) ?? null,
        orderId: data.orderId,
        valueCents: toInt(data.valueCents) ?? 0,
        email: toStr(data.email ?? undefined, 256) ?? null,
      },
    });
  }

  /** Everything the admin "Carts" tab renders, in one query batch. */
  async getSummary(params: SummaryParams = {}): Promise<CartAnalyticsSummary> {
    const gte = params.from ? new Date(params.from) : undefined;
    const to = params.to ? new Date(params.to) : undefined;
    // Make `to` inclusive of the whole day when a date-only string is given.
    const lte = to ? new Date(to.getTime() + (params.to && params.to.length <= 10 ? 86_399_000 : 0)) : undefined;
    const range = gte || lte ? { gte, lte } : undefined;
    const where = range ? { createdAt: range } : {};

    const checkoutWindowMs = Math.max(1, params.checkoutWindowMin ?? 60) * 60_000;
    const cartWindowMs = Math.max(1, params.cartWindowHours ?? 24) * 3_600_000;

    const [byType, topViewedRaw, topSearchRaw, flowEvents] = await Promise.all([
      prisma.analyticsEvent.groupBy({
        by: ['type'],
        where,
        _count: { _all: true },
      }),
      prisma.analyticsEvent.groupBy({
        by: ['productId'],
        where: { ...where, type: AnalyticsEventType.PRODUCT_VIEW, productId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { productId: 'desc' } },
        take: 10,
      }),
      prisma.analyticsEvent.groupBy({
        by: ['query'],
        where: { ...where, type: AnalyticsEventType.SEARCH, query: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { query: 'desc' } },
        take: 10,
      }),
      prisma.analyticsEvent.findMany({
        where: {
          ...where,
          type: {
            in: [
              AnalyticsEventType.ADD_TO_CART,
              AnalyticsEventType.REMOVE_FROM_CART,
              AnalyticsEventType.CHECKOUT_STARTED,
              AnalyticsEventType.PURCHASED,
            ],
          },
        },
        select: {
          type: true,
          sessionId: true,
          userId: true,
          email: true,
          itemCount: true,
          valueCents: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const countOf = (t: string) => byType.find((r) => r.type === t)?._count._all ?? 0;
    const funnel = {
      productViews: countOf(AnalyticsEventType.PRODUCT_VIEW),
      addToCart: countOf(AnalyticsEventType.ADD_TO_CART),
      checkoutStarted: countOf(AnalyticsEventType.CHECKOUT_STARTED),
      purchased: countOf(AnalyticsEventType.PURCHASED),
    };
    const conversionRate = funnel.addToCart > 0 ? funnel.purchased / funnel.addToCart : 0;

    // Resolve product names for the "most viewed" list.
    const viewedIds = topViewedRaw.map((r) => r.productId).filter((id): id is string => !!id);
    const products = viewedIds.length
      ? await prisma.product.findMany({ where: { id: { in: viewedIds } }, select: { id: true, name: true } })
      : [];
    const nameById = new Map(products.map((p) => [p.id, p.name]));
    const topViewed = topViewedRaw
      .filter((r) => r.productId)
      .map((r) => ({
        productId: r.productId as string,
        name: nameById.get(r.productId as string) ?? '—',
        count: r._count._all,
      }));

    const topSearches = topSearchRaw
      .filter((r) => r.query)
      .map((r) => ({ query: r.query as string, count: r._count._all }));

    // Per-session two-stage abandonment classification (pure helper).
    const { abandonedCheckoutRows, abandonedCartRows } = classifyAbandonment(flowEvents, {
      now: Date.now(),
      checkoutWindowMs,
      cartWindowMs,
    });

    const sumValue = (rows: AbandonedCartRow[]) => rows.reduce((n, r) => n + r.valueCents, 0);

    return {
      funnel,
      conversionRate,
      abandonedCheckouts: { count: abandonedCheckoutRows.length, valueCents: sumValue(abandonedCheckoutRows) },
      abandonedCarts: { count: abandonedCartRows.length, valueCents: sumValue(abandonedCartRows) },
      topViewed,
      topSearches,
      abandonedCheckoutRows: abandonedCheckoutRows.slice(0, 50),
      abandonedCartRows: abandonedCartRows.slice(0, 50),
    };
  }
}

export const analyticsService = new AnalyticsService();
