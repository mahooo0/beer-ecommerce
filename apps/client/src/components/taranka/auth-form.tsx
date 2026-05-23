"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { useAuth } from "@/lib/auth-store";

const pillInput =
  "h-12 rounded-full border-[#B5B2A7] bg-white px-5 text-sm text-ink-900 shadow-none focus-visible:border-ink-900 focus-visible:ring-0";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const signIn = useAuth((s) => s.signIn);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isSignUp = mode === "sign-up";
  const valid = email.trim() && password.trim() && (!isSignUp || name.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    setTimeout(() => {
      signIn(email.trim(), name.trim() || undefined);
      router.push("/");
    }, 400);
  };

  return (
    <div className="w-full max-w-[440px] rounded-[20px] bg-white p-8 font-taranka-body">
      <h1 className="font-taranka-display text-2xl font-extrabold uppercase tracking-wide text-ink-900">
        {isSignUp ? "Rejestracja" : "Zaloguj się"}
      </h1>
      <p className="mt-2 text-sm text-[#9E9B90]">
        {isSignUp
          ? "Załóż konto, aby zamawiać szybciej."
          : "Witamy z powrotem w sklepie Taranka."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {isSignUp && (
          <div className="space-y-2">
            <Label htmlFor="auth-name" className="text-sm font-normal text-ink-900">
              Imię
            </Label>
            <Input
              id="auth-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={pillInput}
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="auth-email" className="text-sm font-normal text-ink-900">
            Email
          </Label>
          <Input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={pillInput}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="auth-password" className="text-sm font-normal text-ink-900">
            Hasło
          </Label>
          <div className="relative">
            <Input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={pillInput + " pr-12"}
              required
              minLength={isSignUp ? 8 : undefined}
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

        {!isSignUp && (
          <div className="flex justify-end">
            <Link
              href="#"
              className="text-sm text-brand-red-500 transition-colors hover:text-brand-red-700"
            >
              Zapomniałeś hasła?
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={!valid || submitting}
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand-red-500 text-base font-medium text-cream-50 shadow-[0_0_0_0_rgba(170,60,55,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-700 hover:shadow-[0_8px_24px_-4px_rgba(170,60,55,0.5)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {submitting ? "..." : isSignUp ? "Zarejestruj się" : "Zaloguj się"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-ink-900">
        {isSignUp ? (
          <>
            Masz już konto?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-brand-red-500 transition-colors hover:text-brand-red-700"
            >
              Zaloguj się
            </Link>
          </>
        ) : (
          <>
            Nie masz konta?{" "}
            <Link
              href="/sign-up"
              className="font-medium text-brand-red-500 transition-colors hover:text-brand-red-700"
            >
              Zarejestruj się
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
