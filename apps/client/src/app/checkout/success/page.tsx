import Link from "next/link";
import type { Metadata } from "next";
import { Check } from "lucide-react";
import { TarankaFooter } from "@/components/taranka/footer";

export const metadata: Metadata = {
  title: "Dziękujemy! | Taranka",
};

export default function CheckoutSuccessPage() {
  return (
    <>
      <div className="mx-auto max-w-[1440px] px-[120px] py-16 font-taranka-body">
        <div className="rounded-[20px] bg-white p-12 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand-red-500 text-cream-50">
            <Check className="size-8" strokeWidth={2.5} />
          </div>
          <h1 className="mt-6 font-taranka-display text-2xl font-extrabold uppercase text-ink-900">
            Dziękujemy za zamówienie!
          </h1>
          <p className="mt-3 text-base text-[#443029]">
            Wysłaliśmy potwierdzenie na podany adres email. Wkrótce skontaktujemy się w sprawie
            dostawy.
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-brand-red-500 px-9 text-base font-medium text-cream-50 transition-colors hover:bg-brand-red-700"
          >
            Wróć do katalogu
          </Link>
        </div>
      </div>
      <TarankaFooter />
    </>
  );
}
