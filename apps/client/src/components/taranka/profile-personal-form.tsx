"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";
import { useAuth } from "@/lib/auth-store";

const pillInput =
  "h-12 max-w-[332px] rounded-full border-[#B5B2A7] bg-white px-5 text-sm text-ink-900 shadow-none focus-visible:border-ink-900 focus-visible:ring-0";

export function ProfilePersonalForm() {
  const user = useAuth((s) => s.user);
  const signIn = useAuth((s) => s.signIn);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(email, name);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="flex-1 rounded-[20px] bg-white p-12 font-taranka-body">
      <h1 className="font-taranka-display text-2xl font-extrabold uppercase tracking-wide text-ink-900">
        Dane osobowe
      </h1>

      <form onSubmit={handleSave} className="mt-8 max-w-[332px] space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-normal text-ink-900">
            Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={pillInput}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company" className="text-sm font-normal text-ink-900">
            Nazwa firmy
          </Label>
          <Input
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={pillInput}
          />
        </div>

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
          />
        </div>

        <Separator className="my-6" />

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-normal text-ink-900">
            Hasło
          </Label>
          <div className="relative max-w-[332px]">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={pillInput + " pr-12"}
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
          <Link
            href="#"
            className="inline-block text-sm text-ink-900 underline underline-offset-2 hover:text-brand-red-500"
          >
            Zapomniałeś hasła?
          </Link>
        </div>

        <button
          type="submit"
          className="mt-4 inline-flex h-12 w-full max-w-[333px] items-center justify-center rounded-full bg-brand-red-500 text-base font-medium text-cream-50 shadow-[0_0_0_0_rgba(170,60,55,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-700 hover:shadow-[0_8px_24px_-4px_rgba(170,60,55,0.5)]"
        >
          {saved ? "Zapisano ✓" : "Zapisz"}
        </button>
      </form>
    </div>
  );
}
