import { sortedWholesaleTiers, type WholesaleTier } from "@repo/types";

/**
 * Display maths for wholesale quantity pricing, shared by the cart, mini-cart and
 * wholesale quick-order so the "how much do I save / how much more to save more"
 * story is told the same way everywhere.
 *
 * Prices in the Taranka cart store are MAJOR units (złoty); this module works in
 * cents internally and returns cents, so callers format with `formatZl`.
 */

/** A cart line as understood by the wholesale display helpers. */
export interface WholesaleLineInput {
  qty: number;
  newPrice: number; // effective unit price (major units) — already tier-resolved by the cart store
  oldPrice: number; // crossed-out / retail unit price (major units)
  basePriceCents?: number; // authoritative retail unit price (cents), when available
  tiers?: WholesaleTier[]; // wholesale quantity tiers (cents), when available
}

export interface WholesaleLineInfo {
  retailUnitCents: number; // retail unit price the effective rate is compared against
  effUnitCents: number; // effective (charged) unit price
  showCrossed: boolean; // effective genuinely below retail — show the crossed price (sale OR tier)
  savedCents: number; // WHOLESALE-only line saving (retail − effective) × qty; 0 for retail
  hasSaving: boolean; // there is a wholesale saving to advertise on this line
  /** The next cheaper tier the buyer hasn't reached yet, if any (wholesale only). */
  next: {
    addQty: number; // units to add to reach it
    minQty: number; // its threshold
    unitCents: number; // its per-unit rate
    extraSavedPerUnitCents: number; // how much lower than the current effective unit
  } | null;
}

/**
 * Per-line pricing for display. The crossed price (`showCrossed`) is shown for
 * ANY reduction — a retail sale or a wholesale tier. The advertised *saving*
 * (`savedCents` / `hasSaving`) and the next-tier nudge (`next`) are WHOLESALE-only,
 * so a retail sale is never mislabelled as a "wholesale discount" (the retail
 * loyalty discount is a separate, server-computed line).
 */
export function wholesaleLineInfo(
  item: WholesaleLineInput,
  isWholesale: boolean,
): WholesaleLineInfo {
  const retailUnitCents = item.basePriceCents ?? Math.round(item.oldPrice * 100);
  const effUnitCents = Math.round(item.newPrice * 100);
  const perUnitSaved = Math.max(0, retailUnitCents - effUnitCents);
  const savedCents = isWholesale ? perUnitSaved * item.qty : 0;

  let next: WholesaleLineInfo["next"] = null;
  if (isWholesale) {
    const tiers = sortedWholesaleTiers(item.tiers);
    const upcoming = tiers.find((t) => t.minQty > item.qty);
    if (upcoming && upcoming.unitPrice < effUnitCents) {
      next = {
        addQty: upcoming.minQty - item.qty,
        minQty: upcoming.minQty,
        unitCents: upcoming.unitPrice,
        extraSavedPerUnitCents: effUnitCents - upcoming.unitPrice,
      };
    }
  }

  return {
    retailUnitCents,
    effUnitCents,
    showCrossed: perUnitSaved > 0,
    savedCents,
    hasSaving: savedCents > 0,
    next,
  };
}

/** Total WHOLESALE savings across a cart (cents): Σ (retail − effective) × qty. */
export function wholesaleCartSavingsCents(
  items: WholesaleLineInput[],
  isWholesale: boolean,
): number {
  return items.reduce((sum, it) => sum + wholesaleLineInfo(it, isWholesale).savedCents, 0);
}
