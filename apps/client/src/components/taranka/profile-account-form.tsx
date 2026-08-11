"use client";

import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useTranslation } from "react-i18next";
import { Settings } from "lucide-react";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";
import { cn } from "@/lib/utils";
import {
  getProfile,
  updateName,
  updatePhone,
  updateAccountType,
  type ProfileData,
  type CustomerType,
} from "@/app/profile/actions";

const pillInput =
  "h-12 max-w-[360px] rounded-full border-[#B5B2A7] bg-white px-5 text-sm text-ink-900 shadow-none focus-visible:border-ink-900 focus-visible:ring-0";

const redButton =
  "inline-flex h-11 items-center justify-center rounded-full bg-brand-red-500 px-8 text-sm font-medium text-cream-50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-700 disabled:pointer-events-none disabled:opacity-60";

function errMsg(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

export function ProfileAccountForm() {
  const { t } = useTranslation("profile");
  const { openUserProfile } = useClerk();
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState("");

  // personal
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [personalMsg, setPersonalMsg] = useState<string | null>(null);
  const [personalErr, setPersonalErr] = useState<string | null>(null);

  // account type
  const [customerType, setCustomerType] = useState<CustomerType>("RETAIL");
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [savingType, setSavingType] = useState(false);
  const [typeMsg, setTypeMsg] = useState<string | null>(null);
  const [typeErr, setTypeErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getProfile()
      .then((p: ProfileData | null) => {
        if (!active || !p) return;
        setFirstName(p.firstName);
        setLastName(p.lastName);
        setEmail(p.email);
        setAvatar(p.avatar);
        setPhone(p.phone);
        setCustomerType(p.customerType);
        setCompanyName(p.companyName);
        setTaxId(p.taxId);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  async function savePersonal(e: React.FormEvent) {
    e.preventDefault();
    setPersonalErr(null);
    setPersonalMsg(null);
    setSavingPersonal(true);
    try {
      await updateName(firstName, lastName);
      const res = await updatePhone(phone);
      setPhone(res.phone);
      setPersonalMsg(t("account.saved"));
      setTimeout(() => setPersonalMsg(null), 2000);
    } catch (e) {
      setPersonalErr(errMsg(e, t("account.saveError")));
    } finally {
      setSavingPersonal(false);
    }
  }

  async function saveType(e: React.FormEvent) {
    e.preventDefault();
    setTypeErr(null);
    setTypeMsg(null);
    setSavingType(true);
    try {
      await updateAccountType({ customerType, companyName, taxId });
      setTypeMsg(t("account.saved"));
      setTimeout(() => setTypeMsg(null), 2000);
    } catch (e) {
      setTypeErr(errMsg(e, t("account.saveError")));
    } finally {
      setSavingType(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 rounded-[20px] bg-white p-12 font-taranka-body text-ink-900/70">
        {t("account.loading")}
      </div>
    );
  }

  const isWholesale = customerType === "WHOLESALE";

  return (
    <div className="flex-1 space-y-6 font-taranka-body">
      {/* --- Account header: avatar, type, Clerk account manager --- */}
      <div className="flex flex-wrap items-center gap-5 rounded-[20px] bg-white p-8 lg:p-10">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt=""
            className="size-20 shrink-0 rounded-full object-cover ring-2 ring-cream-300"
          />
        ) : (
          <span className="size-20 shrink-0 rounded-full bg-cream-200" />
        )}
        <div className="min-w-0">
          <p className="text-lg font-semibold text-ink-900">
            {[firstName, lastName].filter(Boolean).join(" ") || t("account.yourAccount")}
          </p>
          <p className="truncate text-sm text-ink-900/70">{email}</p>
          <span
            className={cn(
              "mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
              isWholesale
                ? "bg-brand-red-500 text-cream-50"
                : "bg-cream-200 text-ink-900"
            )}
          >
            {isWholesale ? t("account.wholesaleBadge") : t("account.retailBadge")}
          </span>
        </div>
        <button
          type="button"
          onClick={() => openUserProfile()}
          className="ml-auto inline-flex h-11 items-center gap-2 rounded-full border border-[#B5B2A7] px-5 text-sm font-medium text-ink-900 transition-colors hover:bg-[#F5F3EC]"
        >
          <Settings className="size-4" strokeWidth={1.75} />
          {t("account.accountManager")}
        </button>
      </div>

      {/* --- Personal data + phone --- */}
      <form onSubmit={savePersonal} className="rounded-[20px] bg-white p-8 lg:p-12">
        <h1 className="font-taranka-display text-2xl font-extrabold uppercase tracking-wide text-ink-900">
          {t("account.personalDataTitle")}
        </h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-normal text-ink-900">
              {t("account.firstName")}
            </Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={pillInput}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-normal text-ink-900">
              {t("account.lastName")}
            </Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={pillInput}
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="email" className="text-sm font-normal text-ink-900">
            {t("account.email")}
          </Label>
          <Input id="email" value={email} disabled className={pillInput + " opacity-70"} />
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="phone" className="text-sm font-normal text-ink-900">
            {t("account.phone")}
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder={t("account.phonePlaceholder")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={pillInput}
          />
          <p className="text-xs text-ink-900/70">
            {t("account.phoneHint")}
          </p>
        </div>

        {personalErr && <p className="mt-4 text-sm text-brand-red-500">{personalErr}</p>}

        <button type="submit" disabled={savingPersonal} className={cn(redButton, "mt-6")}>
          {savingPersonal ? t("account.saving") : personalMsg ?? t("account.saveButton")}
        </button>
      </form>

      {/* --- Account type (retail / wholesale) --- */}
      <form onSubmit={saveType} className="rounded-[20px] bg-white p-8 lg:p-12">
        <h2 className="font-taranka-display text-xl font-extrabold uppercase tracking-wide text-ink-900">
          {t("account.accountTypeTitle")}
        </h2>
        <p className="mt-2 text-sm text-ink-900/70">
          {t("account.accountTypeDesc")}
        </p>

        <div className="mt-6 grid max-w-[360px] grid-cols-2 gap-1 rounded-full bg-[#EDEBE3] p-1">
          {(
            [
              { value: "RETAIL", label: t("account.retailOption") },
              { value: "WHOLESALE", label: t("account.wholesaleOption") },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCustomerType(opt.value)}
              aria-pressed={customerType === opt.value}
              className={cn(
                "h-10 rounded-full text-sm font-medium transition-colors",
                customerType === opt.value
                  ? "bg-brand-red-500 text-cream-50"
                  : "text-ink-900 hover:text-brand-red-500"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isWholesale && (
          <>
            <Separator className="my-6 max-w-[360px]" />
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-normal text-ink-900">
                {t("account.companyName")}
              </Label>
              <Input
                id="company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={pillInput}
              />
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="taxId" className="text-sm font-normal text-ink-900">
                {t("account.taxId")}
              </Label>
              <Input
                id="taxId"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className={pillInput}
              />
            </div>
          </>
        )}

        {typeErr && <p className="mt-4 text-sm text-brand-red-500">{typeErr}</p>}

        <button type="submit" disabled={savingType} className={cn(redButton, "mt-6")}>
          {savingType ? t("account.saving") : typeMsg ?? t("account.saveButton")}
        </button>
      </form>
    </div>
  );
}
