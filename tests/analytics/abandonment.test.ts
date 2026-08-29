import { describe, it, expect, vi } from 'vitest';

// analytics.service imports { prisma } from '@repo/db'; stub it so importing the
// module is isolated (the classifier under test is pure and never touches it).
vi.mock('/Users/muhemmedibrahimov/work/beer-ecommerce/packages/db/src/index.ts', () => ({
  prisma: { analyticsEvent: {} },
}));

import {
  classifyAbandonment,
  type FlowEvent,
} from '../../apps/server/src/modules/analytics/analytics.service';

const NOW = new Date('2026-08-29T12:00:00.000Z').getTime();
const CHECKOUT_WINDOW_MS = 60 * 60 * 1000; // 1 h
const CART_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 h

const at = (msAgo: number) => new Date(NOW - msAgo);
const HOUR = 60 * 60 * 1000;

/** Convenience event builder with sane defaults. */
function ev(partial: Partial<FlowEvent> & { type: string; sessionId: string; createdAt: Date }): FlowEvent {
  return {
    userId: null,
    email: null,
    itemCount: null,
    valueCents: null,
    ...partial,
  };
}

const opts = { now: NOW, checkoutWindowMs: CHECKOUT_WINDOW_MS, cartWindowMs: CART_WINDOW_MS };

describe('classifyAbandonment', () => {
  it('excludes a session that converted (has a purchased event)', () => {
    const events: FlowEvent[] = [
      ev({ type: 'add_to_cart', sessionId: 's1', itemCount: 2, valueCents: 5000, createdAt: at(3 * HOUR) }),
      ev({ type: 'checkout_started', sessionId: 's1', valueCents: 5000, createdAt: at(2.5 * HOUR) }),
      ev({ type: 'purchased', sessionId: 's1', valueCents: 5000, createdAt: at(2 * HOUR) }),
    ];
    const { abandonedCheckoutRows, abandonedCartRows } = classifyAbandonment(events, opts);
    expect(abandonedCheckoutRows).toHaveLength(0);
    expect(abandonedCartRows).toHaveLength(0);
  });

  it('flags an abandoned checkout when checkout is older than the window and unpaid', () => {
    const events: FlowEvent[] = [
      ev({ type: 'add_to_cart', sessionId: 's2', itemCount: 3, valueCents: 8000, createdAt: at(3 * HOUR) }),
      ev({ type: 'checkout_started', sessionId: 's2', valueCents: 8000, email: 'a@b.pl', createdAt: at(2 * HOUR) }),
    ];
    const { abandonedCheckoutRows, abandonedCartRows } = classifyAbandonment(events, opts);
    expect(abandonedCartRows).toHaveLength(0);
    expect(abandonedCheckoutRows).toHaveLength(1);
    expect(abandonedCheckoutRows[0]).toMatchObject({
      sessionId: 's2',
      email: 'a@b.pl',
      itemCount: 3,
      valueCents: 8000,
      reachedCheckout: true,
    });
  });

  it('does NOT flag a checkout still inside the window', () => {
    const events: FlowEvent[] = [
      ev({ type: 'checkout_started', sessionId: 's3', valueCents: 8000, createdAt: at(0.5 * HOUR) }),
    ];
    const { abandonedCheckoutRows } = classifyAbandonment(events, opts);
    expect(abandonedCheckoutRows).toHaveLength(0);
  });

  it('flags an abandoned cart with items and no checkout, older than the cart window', () => {
    const events: FlowEvent[] = [
      ev({ type: 'add_to_cart', sessionId: 's4', itemCount: 1, valueCents: 2500, createdAt: at(25 * HOUR) }),
    ];
    const { abandonedCartRows, abandonedCheckoutRows } = classifyAbandonment(events, opts);
    expect(abandonedCheckoutRows).toHaveLength(0);
    expect(abandonedCartRows).toHaveLength(1);
    expect(abandonedCartRows[0]).toMatchObject({
      sessionId: 's4',
      itemCount: 1,
      valueCents: 2500,
      reachedCheckout: false,
    });
  });

  it('does NOT flag a cart still inside the 24 h window', () => {
    const events: FlowEvent[] = [
      ev({ type: 'add_to_cart', sessionId: 's5', itemCount: 1, valueCents: 2500, createdAt: at(2 * HOUR) }),
    ];
    const { abandonedCartRows } = classifyAbandonment(events, opts);
    expect(abandonedCartRows).toHaveLength(0);
  });

  it('does NOT flag a cart that was emptied (last snapshot itemCount 0)', () => {
    const events: FlowEvent[] = [
      ev({ type: 'add_to_cart', sessionId: 's6', itemCount: 2, valueCents: 4000, createdAt: at(26 * HOUR) }),
      ev({ type: 'remove_from_cart', sessionId: 's6', itemCount: 0, valueCents: 0, createdAt: at(25 * HOUR) }),
    ];
    const { abandonedCartRows } = classifyAbandonment(events, opts);
    expect(abandonedCartRows).toHaveLength(0);
  });

  it('classifies as checkout (not cart) when a session both added and reached checkout — precedence', () => {
    const events: FlowEvent[] = [
      ev({ type: 'add_to_cart', sessionId: 's7', itemCount: 4, valueCents: 9000, createdAt: at(5 * HOUR) }),
      ev({ type: 'checkout_started', sessionId: 's7', valueCents: 9000, createdAt: at(4 * HOUR) }),
    ];
    const { abandonedCheckoutRows, abandonedCartRows } = classifyAbandonment(events, opts);
    expect(abandonedCheckoutRows).toHaveLength(1);
    expect(abandonedCartRows).toHaveLength(0);
  });

  it('sorts rows by value, highest first', () => {
    const events: FlowEvent[] = [
      ev({ type: 'add_to_cart', sessionId: 'low', itemCount: 1, valueCents: 1000, createdAt: at(30 * HOUR) }),
      ev({ type: 'add_to_cart', sessionId: 'high', itemCount: 5, valueCents: 9000, createdAt: at(30 * HOUR) }),
      ev({ type: 'add_to_cart', sessionId: 'mid', itemCount: 2, valueCents: 5000, createdAt: at(30 * HOUR) }),
    ];
    const { abandonedCartRows } = classifyAbandonment(events, opts);
    expect(abandonedCartRows.map((r) => r.sessionId)).toEqual(['high', 'mid', 'low']);
  });
});
