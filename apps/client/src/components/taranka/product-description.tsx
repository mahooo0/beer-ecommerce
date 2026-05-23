"use client";

import { useState } from "react";

const tabs = [
  {
    label: "Opis",
    content: (
      <div className="space-y-4">
        <p>
          Lorem ipsum dolor sit amet consectetur. Massa dolor id purus hendrerit tellus quis turpis
          ridiculus ut. Velit rutrum sed eu lacus vitae sodales proin eleifend morbi. Erat pretium
          neque molestie vitae massa. Non ultricies dui odio risus. Pellentesque urna diam accumsan
          dui amet.
        </p>
        <p>
          A rhoncus lectus proin semper semper lectus ornare vestibulum odio. Praesent eu habitasse
          sodales orci. Auctor congue a mauris leo nibh hendrerit sit risus. At nisl ut aliquet eget
          massa fringilla eleifend sit. Massa molestie nec nunc risus faucibus in. Aliquet risus
          consectetur proin sapien a mauris magna. Nulla nec ornare netus commodo ut vitae blandit
          lectus. Tristique tortor elementum ut dolor tempus eu at. Suspendisse sit viverra risus
          eget nunc elementum eu rhoncus tellus. Interdum feugiat pretium ultrices urna ultrices
          sed. Nulla sit mauris hendrerit tortor et quis est quam cras. Aliquam morbi pharetra vel
          pulvinar sed augue aliquet…
        </p>
      </div>
    ),
  },
  {
    label: "Skład",
    content: (
      <ul className="list-disc space-y-2 pl-5">
        <li>Mąka kukurydziana</li>
        <li>Cukier</li>
        <li>Olej roślinny</li>
        <li>Aromat mleka</li>
        <li>Sól</li>
        <li>Witaminy (B1, B6)</li>
      </ul>
    ),
  },
];

export function TarankaProductDescription() {
  const [active, setActive] = useState(0);

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

      <div className="mt-6 text-base leading-[24px] text-[#2B2A29]">{tabs[active].content}</div>
    </section>
  );
}
