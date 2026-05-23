"use client";

import { useState } from "react";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";

const inputCls =
  "h-12 w-[329px] rounded-full border-0 bg-white px-5 text-sm text-ink-900 shadow-none focus-visible:ring-2 focus-visible:ring-brand-red-500/30";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setName("");
      setEmail("");
      setMessage("");
      setSent(false);
    }, 1500);
  };

  return (
    <section className="relative overflow-hidden bg-[#D6D3C8] py-16 font-taranka-body">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/contact-pattern.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-full w-[489px] object-cover"
      />

      <div className="relative z-10 mx-auto max-w-[1440px] px-[120px]">
        <div className="ml-[460px]">
          <h2 className="font-taranka-display text-[48px] font-extrabold uppercase leading-none text-ink-900">
            Chcesz zadać pytanie?
          </h2>

          <form onSubmit={handleSubmit} className="mt-8 space-y-3">
            <div className="flex gap-6">
              <Input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                required
              />
            </div>

            <Textarea
              placeholder="Twoja wiadomość"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="h-[90px] w-[684px] resize-none rounded-[20px] border-0 bg-white px-5 py-4 text-sm text-ink-900 shadow-none focus-visible:ring-2 focus-visible:ring-brand-red-500/30"
              required
            />

            <button
              type="submit"
              className="inline-flex h-12 w-[331px] items-center justify-center rounded-full bg-brand-red-500 text-base font-medium text-cream-50 shadow-[0_0_0_0_rgba(170,60,55,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-700 hover:shadow-[0_8px_24px_-4px_rgba(170,60,55,0.5)] active:translate-y-0"
            >
              {sent ? "Wysłano ✓" : "wysyłać"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
