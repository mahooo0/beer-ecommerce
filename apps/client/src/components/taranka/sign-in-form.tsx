"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";
import { GoogleIcon, AppleIcon } from "@/components/taranka/oauth-icons";

const pillInput =
  "h-12 w-full rounded-full border-[#B5B2A7] bg-white px-5 text-sm text-ink-900 shadow-none focus-visible:border-ink-900 focus-visible:ring-0";

const redButton =
  "mt-2 inline-flex h-12 w-full items-center justify-center rounded-full bg-brand-red-500 text-base font-medium text-cream-50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-700 disabled:pointer-events-none disabled:opacity-60";

function clerkError(err: unknown, fallback: string): string {
  const e = err as { errors?: { longMessage?: string; message?: string }[] };
  return e?.errors?.[0]?.longMessage || e?.errors?.[0]?.message || fallback;
}

type Mode = "signin" | "forgot" | "reset";

export function SignInForm() {
  // Use the live Clerk instance directly. The useSignIn()/useSignUp() hooks can
  // report isLoaded:false persistently in this setup, which silently bailed
  // every auth action; useClerk() gives the ready client + setActive reliably.
  const clerk = useClerk();
  const router = useRouter();
  const { t } = useTranslation("auth");

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!clerk.client) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await clerk.client.signIn.create({ identifier: email, password });
      if (res.status === "complete") {
        await clerk.setActive({ session: res.createdSessionId });
        router.push("/");
      } else {
        setError(t("errors.signInFailed"));
      }
    } catch (err) {
      setError(clerkError(err, t("errors.generic")));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendResetCode(e: React.FormEvent) {
    e.preventDefault();
    if (!clerk.client) return;
    setError(null);
    setSubmitting(true);
    try {
      await clerk.client.signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setMode("reset");
    } catch (err) {
      setError(clerkError(err, t("errors.generic")));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!clerk.client) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await clerk.client.signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password: newPassword,
      });
      if (res.status === "complete") {
        await clerk.setActive({ session: res.createdSessionId });
        router.push("/");
      } else {
        setError(t("errors.resetFailed"));
      }
    } catch (err) {
      setError(clerkError(err, t("errors.generic")));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOAuth(strategy: "oauth_google" | "oauth_apple") {
    if (!clerk.client) return;
    setError(null);
    try {
      await clerk.client.signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/`,
      });
    } catch (err) {
      setError(clerkError(err, t("errors.generic")));
    }
  }

  // --- Forgot password: request code ---
  if (mode === "forgot") {
    return (
      <div className="w-full max-w-[420px] rounded-[20px] bg-white p-8 font-taranka-body sm:p-10">
        <h1 className="font-taranka-display text-2xl font-extrabold uppercase tracking-wide text-ink-900">
          {t("forgot.title")}
        </h1>
        <p className="mt-2 text-sm text-ink-900/70">
          {t("forgot.subtitle")}
        </p>
        <form onSubmit={handleSendResetCode} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-normal text-ink-900">
              {t("common.emailLabel")}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={pillInput}
              required
            />
          </div>
          {error && <p className="text-sm text-brand-red-500">{error}</p>}
          <button type="submit" disabled={submitting} className={redButton}>
            {submitting ? t("forgot.sending") : t("forgot.sendCode")}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setError(null);
          }}
          className="mt-4 text-sm text-ink-900 underline underline-offset-2 hover:text-brand-red-500"
        >
          {t("forgot.backToSignIn")}
        </button>
      </div>
    );
  }

  // --- Forgot password: enter code + new password ---
  if (mode === "reset") {
    return (
      <div className="w-full max-w-[420px] rounded-[20px] bg-white p-8 font-taranka-body sm:p-10">
        <h1 className="font-taranka-display text-2xl font-extrabold uppercase tracking-wide text-ink-900">
          {t("reset.title")}
        </h1>
        <p className="mt-2 text-sm text-ink-900/70">
          {t("reset.subtitle")}
        </p>
        <form onSubmit={handleReset} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm font-normal text-ink-900">
              {t("reset.codeLabel")}
            </Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={pillInput}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-normal text-ink-900">
              {t("reset.newPasswordLabel")}
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={pillInput}
              required
            />
          </div>
          {error && <p className="text-sm text-brand-red-500">{error}</p>}
          <button type="submit" disabled={submitting} className={redButton}>
            {submitting ? t("reset.saving") : t("reset.submit")}
          </button>
        </form>
      </div>
    );
  }

  // --- Default: sign in ---
  return (
    <div className="w-full max-w-[420px] rounded-[20px] bg-white p-8 font-taranka-body sm:p-10">
      <h1 className="font-taranka-display text-2xl font-extrabold uppercase tracking-wide text-ink-900">
        {t("signIn.title")}
      </h1>

      <form onSubmit={handleSignIn} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-normal text-ink-900">
            {t("common.emailLabel")}
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={pillInput}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-normal text-ink-900">
            {t("common.passwordLabel")}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={pillInput + " pr-12"}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? t("common.hidePassword") : t("common.showPassword")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9E9B90] transition-colors hover:text-ink-900"
            >
              {showPassword ? (
                <EyeOff className="size-4" strokeWidth={1.75} />
              ) : (
                <Eye className="size-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setMode("forgot");
              setError(null);
            }}
            className="inline-block text-sm text-ink-900 underline underline-offset-2 hover:text-brand-red-500"
          >
            {t("signIn.forgotPassword")}
          </button>
        </div>

        {error && <p className="text-sm text-brand-red-500">{error}</p>}

        {/* Clerk bot-protection mount point for custom flows */}
        <div id="clerk-captcha" />

        <button type="submit" disabled={submitting} className={redButton}>
          {submitting ? t("signIn.submitting") : t("signIn.submit")}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs uppercase tracking-wide text-ink-900/70">{t("common.or")}</span>
        <Separator className="flex-1" />
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handleOAuth("oauth_google")}
          className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[#B5B2A7] bg-white text-sm font-medium text-ink-900 transition-colors hover:bg-[#F5F3EC]"
        >
          <GoogleIcon />
          {t("oauth.google")}
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("oauth_apple")}
          className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border border-ink-900 bg-ink-900 text-sm font-medium text-cream-50 transition-colors hover:bg-black"
        >
          <AppleIcon />
          {t("oauth.apple")}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-ink-900">
        {t("signIn.noAccount")}{" "}
        <Link
          href="/sign-up"
          className="font-medium text-brand-red-500 underline underline-offset-2"
        >
          {t("signIn.signUpLink")}
        </Link>
      </p>
    </div>
  );
}
