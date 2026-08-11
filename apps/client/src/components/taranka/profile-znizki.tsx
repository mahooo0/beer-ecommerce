import { getServerT } from "@/lib/i18n/server";

interface Tier {
  key: "small" | "medium" | "large";
  percent: string;
  amount: string;
  active?: boolean;
}

const tiers: Tier[] = [
  { key: "small", percent: "3%", amount: "1 000", active: true },
  { key: "medium", percent: "5%", amount: "5 000" },
  { key: "large", percent: "15%", amount: "15 000" },
];

export async function ProfileZnizki() {
  const t = await getServerT("profile");

  return (
    <div className="flex-1 font-taranka-body">
      <h1 className="font-taranka-display text-2xl font-extrabold uppercase tracking-wide text-brand-red-500">
        {t("znizki.currentDiscount")}
      </h1>

      <p className="mt-6 max-w-[824px] text-base leading-[24px] text-ink-900">
        {t("znizki.intro")}
      </p>

      <h2 className="mt-12 font-taranka-display text-2xl font-extrabold uppercase tracking-wide text-ink-900">
        {t("znizki.howItWorks")}
      </h2>

      <ul className="mt-6 grid grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <li
            key={tier.key}
            className={`flex h-[249px] flex-col items-center justify-center rounded-[20px] px-6 py-8 text-center text-cream-50 transition-transform hover:scale-[1.02] ${
              tier.active ? "bg-brand-red-500" : "bg-[#9E9B90]"
            }`}
          >
            <h3 className="font-taranka-display text-xl font-extrabold uppercase tracking-wide">
              {t(`znizki.tiers.${tier.key}.title`)}
            </h3>
            <p className="mt-4 font-taranka-display text-[64px] font-extrabold leading-none">
              {tier.percent}
            </p>
            <p className="mt-4 max-w-[220px] text-sm leading-[24px]">
              {t("znizki.tierDesc", { amount: tier.amount })}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-10 max-w-[824px] space-y-4 text-base leading-[24px] text-ink-900">
        <p>{t("znizki.para1")}</p>
        <p>{t("znizki.para2")}</p>
        <p>{t("znizki.para3")}</p>
      </div>
    </div>
  );
}
