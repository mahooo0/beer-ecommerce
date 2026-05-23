interface Tier {
  title: string;
  percent: string;
  description: string;
  active?: boolean;
}

const tiers: Tier[] = [
  {
    title: "Mała Hurtownia",
    percent: "3%",
    description: "dla miesięcznych zakupów na kwotę 1 000 PLN lub wyższą",
    active: true,
  },
  {
    title: "Średni Hurt",
    percent: "5%",
    description: "dla miesięcznych zakupów na kwotę 5 000 PLN lub wyższą",
  },
  {
    title: "Duży Hurt",
    percent: "15%",
    description: "dla miesięcznych zakupów na kwotę 15 000 PLN lub wyższą",
  },
];

export function ProfileZnizki() {
  return (
    <div className="flex-1 font-taranka-body">
      <h1 className="font-taranka-display text-2xl font-extrabold uppercase tracking-wide text-brand-red-500">
        Twój rabat wynosi teraz 3%
      </h1>

      <p className="mt-6 max-w-[824px] text-base leading-[24px] text-ink-900">
        Lorem ipsum dolor sit amet consectetur. Massa dolor id purus hendrerit tellus quis turpis
        ridiculus ut. Velit rutrum sed eu lacus vitae sodales proin eleifend morbi. Erat pretium
        neque molestie vitae massa. Non ultricies dui odio risus. Pellentesque urna diam accumsan
        dui amet…
      </p>

      <h2 className="mt-12 font-taranka-display text-2xl font-extrabold uppercase tracking-wide text-ink-900">
        Jak działają zniżki?
      </h2>

      <ul className="mt-6 grid grid-cols-3 gap-6">
        {tiers.map((t) => (
          <li
            key={t.title}
            className={`flex h-[249px] flex-col items-center justify-center rounded-[20px] px-6 py-8 text-center text-cream-50 transition-transform hover:scale-[1.02] ${
              t.active ? "bg-brand-red-500" : "bg-[#9E9B90]"
            }`}
          >
            <h3 className="font-taranka-display text-xl font-extrabold uppercase tracking-wide">
              {t.title}
            </h3>
            <p className="mt-4 font-taranka-display text-[64px] font-extrabold leading-none">
              {t.percent}
            </p>
            <p className="mt-4 max-w-[220px] text-sm leading-[24px]">{t.description}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 max-w-[824px] space-y-4 text-base leading-[24px] text-ink-900">
        <p>
          Lorem ipsum dolor sit amet consectetur. Massa dolor id purus hendrerit tellus quis turpis
          ridiculus ut. Velit rutrum sed eu lacus vitae sodales proin eleifend morbi. Erat pretium
          neque molestie vitae massa. Non ultricies dui odio risus. Pellentesque urna diam accumsan
          dui amet.
        </p>
        <p>
          A rhoncus lectus proin semper semper lectus ornare vestibulum odio. Praesent eu habitasse
          sodales orci. Auctor congue a mauris leo nibh hendrerit sit risus. At nisl ut aliquet
          eget massa fringilla eleifend sit. Massa molestie nec nunc risus faucibus in. Aliquet
          risus consectetur proin sapien a mauris magna. Nulla nec ornare netus commodo ut vitae
          blandit lectus. Tristique tortor elementum ut dolor tempus eu at. Suspendisse sit viverra
          risus eget nunc elementum eu rhoncus tellus. Interdum feugiat pretium ultrices urna
          ultrices sed. Nulla sit mauris hendrerit tortor et quis est quam cras. Aliquam morbi
          pharetra vel pulvinar sed augue aliquet.
        </p>
        <p>
          Eget arcu cras blandit ut malesuada tortor. Mi gravida elementum et quis scelerisque
          nulla ut in at. Eget nulla egestas non curabitur commodo vel tortor lacinia ultricies.
          Aenean sollicitudin dui urna ut bibendum placerat.
        </p>
      </div>
    </div>
  );
}
