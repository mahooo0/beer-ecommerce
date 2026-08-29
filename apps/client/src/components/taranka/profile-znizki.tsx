import { auth } from "@clerk/nextjs/server";
import type { LoyaltyTier } from "@repo/types";
import { getServerT } from "@/lib/i18n/server";
import { api } from "@/lib/api";

// Localized names for the first three tiers; extra tiers fall back to "Level N".
const TITLE_KEYS = ["small", "medium", "large"] as const;

/** Whole-złoty threshold, e.g. 100000 cents → "1 000". */
function formatZlWhole(cents: number): string {
  return Math.round(cents / 100)
    .toLocaleString("pl-PL")
    .replace(/ /g, " ");
}

export async function ProfileZnizki() {
  const t = await getServerT("profile");

  // Active tiers (cheapest first) + the signed-in customer's lifetime paid spend.
  let tiers: LoyaltyTier[] = [];
  let spentCents = 0;

  try {
    const tiersRes = await api.loyaltyTiers.getActive();
    if (tiersRes.success && tiersRes.data) tiers = tiersRes.data;
  } catch {
    /* API unavailable → no tiers */
  }

  try {
    const { userId, getToken } = await auth();
    if (userId) {
      const token = (await getToken()) ?? undefined;
      const spendRes = await api.orders.getUserSpend(userId, token);
      if (spendRes.success && spendRes.data) spentCents = spendRes.data.spentCents;
    }
  } catch {
    /* guest / not signed in → spend 0 */
  }

  const sorted = [...tiers].sort((a, b) => a.minSpendCents - b.minSpendCents);
  // Current tier = the highest threshold the cumulative spend reaches.
  const activeTier =
    [...sorted].reverse().find((tier) => spentCents >= tier.minSpendCents) ?? null;
  const currentPercent = activeTier?.percent ?? 0;

  return (
    <div className="flex-1 font-taranka-body">
      <h1 className="font-taranka-display text-2xl font-extrabold uppercase tracking-wide text-brand-red-500">
        {t("znizki.currentDiscount", { percent: currentPercent })}
      </h1>

      <p className="mt-6 max-w-[824px] text-base leading-[24px] text-ink-900">
        {t("znizki.intro")}
      </p>

      <h2 className="mt-12 font-taranka-display text-2xl font-extrabold uppercase tracking-wide text-ink-900">
        {t("znizki.howItWorks")}
      </h2>

      {sorted.length > 0 && (
        <ul className="mt-6 grid grid-cols-3 gap-6">
          {sorted.map((tier, i) => {
            const isActive = activeTier?.id === tier.id;
            const titleKey = TITLE_KEYS[i];
            const title = titleKey
              ? t(`znizki.tiers.${titleKey}.title`)
              : t("znizki.tierLevel", { level: i + 1 });
            return (
              <li
                key={tier.id}
                className={`flex h-[249px] flex-col items-center justify-center rounded-[20px] px-6 py-8 text-center text-cream-50 transition-transform hover:scale-[1.02] ${
                  isActive ? "bg-brand-red-500" : "bg-[#9E9B90]"
                }`}
              >
                <h3 className="font-taranka-display text-xl font-extrabold uppercase tracking-wide">
                  {title}
                </h3>
                <p className="mt-4 font-taranka-display text-[64px] font-extrabold leading-none">
                  {tier.percent}%
                </p>
                <p className="mt-4 max-w-[220px] text-sm leading-[24px]">
                  {t("znizki.tierDesc", { amount: formatZlWhole(tier.minSpendCents) })}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-10 max-w-[824px] space-y-4 text-base leading-[24px] text-ink-900">
        <p>{t("znizki.para1")}</p>
        <p>{t("znizki.para2")}</p>
        <p>{t("znizki.para3")}</p>
      </div>
    </div>
  );
}
