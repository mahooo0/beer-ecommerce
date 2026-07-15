"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";
import { GoogleIcon, AppleIcon } from "@/components/taranka/oauth-icons";
import { cn } from "@/lib/utils";

type CustomerType = "RETAIL" | "WHOLESALE";

const pillInput =
  "h-12 w-full rounded-full border-[#B5B2A7] bg-white px-5 text-sm text-ink-900 shadow-none focus-visible:border-ink-900 focus-visible:ring-0";

const redButton =
  "mt-2 inline-flex h-12 w-full items-center justify-center rounded-full bg-brand-red-500 text-base font-medium text-cream-50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-700 disabled:pointer-events-none disabled:opacity-60";

function clerkError(err: unknown): string {
  const e = err as { errors?: { longMessage?: string; message?: string }[] };
  return (
    e?.errors?.[0]?.longMessage ||
    e?.errors?.[0]?.message ||
    "Coś poszło nie tak. Spróbuj ponownie."
  );
}

// Registration is intentionally minimal — email + password (or Google/Apple).
// Phone, account type (retail/wholesale) and company details are added later in
// the account area (/profile), not here.
export function SignUpForm() {
  // Live Clerk instance — the useSignUp() hook's isLoaded can stay false here
  // and silently bail every action; useClerk() gives the ready client reliably.
  const clerk = useClerk();
  const router = useRouter();

  // Chosen once here and carried into the account (email, Google and Apple all
  // route through signUp.create({ unsafeMetadata }), so it survives OAuth).
  const [customerType, setCustomerType] = useState<CustomerType>("RETAIL");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clerk.client) return;
    setError(null);
    setSubmitting(true);
    try {
      await clerk.client.signUp.create({
        emailAddress: email,
        password,
        unsafeMetadata: { customerType },
      });
      await clerk.client.signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!clerk.client) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await clerk.client.signUp.attemptEmailAddressVerification({ code });
      if (res.status === "complete") {
        await clerk.setActive({ session: res.createdSessionId });
        router.push("/");
      } else {
        setError("Nie udało się zweryfikować kodu. Spróbuj ponownie.");
      }
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOAuth(strategy: "oauth_google" | "oauth_apple") {
    if (!clerk.client) return;
    setError(null);
    try {
      // Seed the chosen type on the signUp resource first — authenticateWithRedirect
      // continues this same resource, so the type persists through the OAuth round-trip.
      await clerk.client.signUp.create({ unsafeMetadata: { customerType } });
      await clerk.client.signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/`,
      });
    } catch (err) {
      setError(clerkError(err));
    }
  }

  if (pendingVerification) {
    return (
      <div className="w-full max-w-[420px] rounded-[20px] bg-white p-8 font-taranka-body sm:p-10">
        <h1 className="font-taranka-display text-2xl font-extrabold uppercase tracking-wide text-ink-900">
          Potwierdź email
        </h1>
        <p className="mt-2 text-sm text-ink-900/70">
          Wysłaliśmy kod na <span className="font-medium">{email}</span>.
        </p>
        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm font-normal text-ink-900">
              Kod weryfikacyjny
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
          {error && <p className="text-sm text-brand-red-500">{error}</p>}
          <button type="submit" disabled={submitting} className={redButton}>
            {submitting ? "Weryfikacja…" : "Potwierdź"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] rounded-[20px] bg-white p-8 font-taranka-body sm:p-10">
      <h1 className="font-taranka-display text-2xl font-extrabold uppercase tracking-wide text-ink-900">
        Rejestracja
      </h1>

      {/* Account type — choose once; applies whether you sign up with email, Google or Apple */}
      <p className="mt-5 text-sm font-normal text-ink-900">Rejestruję się jako:</p>
      <div className="mt-2 grid grid-cols-2 gap-1 rounded-full bg-[#EDEBE3] p-1">
        {(
          [
            { value: "RETAIL", label: "Klient" },
            { value: "WHOLESALE", label: "Dostawca" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setCustomerType(opt.value)}
            aria-pressed={customerType === opt.value}
            className={cn(
              "h-11 rounded-full text-sm font-medium transition-colors",
              customerType === opt.value
                ? "bg-brand-red-500 text-cream-50"
                : "text-ink-900 hover:text-brand-red-500"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-normal text-ink-900">
            Email
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
            Hasło
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
              aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9E9B90] transition-colors hover:text-ink-900"
            >
              {showPassword ? (
                <EyeOff className="size-4" strokeWidth={1.75} />
              ) : (
                <Eye className="size-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-brand-red-500">{error}</p>}

        {/* Clerk bot-protection mount point for custom flows */}
        <div id="clerk-captcha" />

        <button type="submit" disabled={submitting} className={redButton}>
          {submitting ? "Rejestracja…" : "Zarejestruj się"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs uppercase tracking-wide text-ink-900/70">lub</span>
        <Separator className="flex-1" />
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handleOAuth("oauth_google")}
          className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[#B5B2A7] bg-white text-sm font-medium text-ink-900 transition-colors hover:bg-[#F5F3EC]"
        >
          <GoogleIcon />
          Kontynuuj z Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("oauth_apple")}
          className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border border-ink-900 bg-ink-900 text-sm font-medium text-cream-50 transition-colors hover:bg-black"
        >
          <AppleIcon />
          Kontynuuj z Apple
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-ink-900">
        Masz już konto?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-brand-red-500 underline underline-offset-2"
        >
          Zaloguj się
        </Link>
      </p>

      <p className="mt-3 text-center text-xs text-ink-900/70">
        Numer telefonu i dane firmy dodasz później w swoim koncie.
      </p>
    </div>
  );
}
