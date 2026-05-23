import Link from "next/link";
import { Facebook, Instagram, Send, MapPin, Mail, Phone, Youtube } from "lucide-react";

const menuLinks = [
  { label: "Snaks", href: "#" },
  { label: "Kiszonki", href: "#" },
  { label: "WINO", href: "#" },
  { label: "Słodycze", href: "#" },
];

const clientLinks = [
  { label: "Zaloguj się", href: "#" },
  { label: "Wakaty", href: "#" },
  { label: "Dostawa i płatność", href: "#" },
];

const aboutLinks = [
  { label: "Franczyza", href: "#" },
  { label: "Kontakty", href: "#" },
];

const socials = [
  { label: "Facebook", icon: Facebook, href: "#" },
  { label: "Instagram", icon: Instagram, href: "#" },
  { label: "Telegram", icon: Send, href: "#" },
  { label: "YouTube", icon: Youtube, href: "#" },
];

export function TarankaFooter() {
  return (
    <footer className="bg-ink-900 font-taranka-body text-cream-50">
      <div className="mx-auto max-w-[1440px] px-[120px] pb-6 pt-10">
        <div className="grid grid-cols-[230px_1fr_1fr_1fr_1.2fr] gap-x-[24px]">
          <div className="flex flex-col">
            <Link href="/" className="mb-8 inline-flex" aria-label="Taranka">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/taranka-logo.svg"
                alt="Taranka"
                width={123}
                height={48}
                className="h-12 w-auto [filter:brightness(0)_invert(1)]"
              />
            </Link>

            <div className="flex gap-6">
              {socials.map(({ label, icon: Icon, href }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex size-10 items-center justify-center rounded-full border border-cream-50/60 text-cream-50 transition-all duration-300 hover:scale-110 hover:border-cream-50 hover:bg-cream-50 hover:text-ink-900"
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </Link>
              ))}
            </div>
          </div>

          <FooterColumn title="Menu" links={menuLinks} />
          <FooterColumn title="Dla klientów" links={clientLinks} />
          <FooterColumn title="O nas" links={aboutLinks} />

          <div>
            <h3 className="mb-4 font-taranka-display text-xl font-extrabold uppercase">Kontakty</h3>
            <ul className="space-y-3 text-base">
              <ContactRow icon={MapPin}>Piaskowa 92/95, 55-296 Świdnik</ContactRow>
              <ContactRow icon={Mail}>habonnanifri-1232@yopmail.com</ContactRow>
              <ContactRow icon={Phone}>+48 55 250 34 10</ContactRow>
              <ContactRow icon={Phone}>+48 55 250 34 10</ContactRow>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-cream-50/15 pt-4 text-sm text-cream-50/80">
          <p>Copyright © 2024 All Rights Reserved</p>
          <div className="flex gap-10">
            <Link href="#" className="underline underline-offset-2 transition-colors hover:text-cream-50">
              Polityka prywatności RODO
            </Link>
            <Link href="#" className="underline underline-offset-2 transition-colors hover:text-cream-50">
              Polityka prywatności
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="mb-4 font-taranka-display text-xl font-extrabold uppercase">{title}</h3>
      <ul className="space-y-3 text-base">
        {links.map(({ label, href }) => (
          <li key={label}>
            <Link
              href={href}
              className="transition-colors duration-200 hover:text-brand-red-500"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3">
      <Icon className="size-4 shrink-0 text-cream-50" strokeWidth={1.75} />
      <span>{children}</span>
    </li>
  );
}
