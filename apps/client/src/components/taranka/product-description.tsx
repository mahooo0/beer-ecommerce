"use client";

import { useState } from "react";

const skladContent = (
  <ul className="list-disc space-y-2 pl-5">
    <li>Mąka kukurydziana</li>
    <li>Cukier</li>
    <li>Olej roślinny</li>
    <li>Aromat mleka</li>
    <li>Sól</li>
    <li>Witaminy (B1, B6)</li>
  </ul>
);

export function TarankaProductDescription({ description }: { description?: string } = {}) {
  const [active, setActive] = useState(0);

  const opisContent = description ? (
    <div className="space-y-4 whitespace-pre-line">{description}</div>
  ) : (
    <p className="text-[#9E9B90]">Brak opisu produktu.</p>
  );

  const tabs = [
    { label: "Opis", content: opisContent },
    { label: "Skład", content: skladContent },
  ];

  return (
    <section className="font-taranka-body">
      <div className="flex items-center gap-12 border-b border-cream-300">
        {tabs.map((tab, i) => {
          const isActive = i === active;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActive(i)}
              className={`relative -mb-px pb-3 font-taranka-display text-[28px] font-extrabold uppercase tracking-wide transition-colors ${
                isActive ? "text-ink-900" : "text-[#9E9B90] hover:text-ink-900"
              }`}
            >
              {tab.label}
              <span
                className={`absolute inset-x-0 -bottom-px h-0.5 bg-brand-red-500 transition-transform duration-300 ${
                  isActive ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-6 text-base leading-[24px] text-[#2B2A29]">{tabs[active]?.content}</div>
    </section>
  );
}
