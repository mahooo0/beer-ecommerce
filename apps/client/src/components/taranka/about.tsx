export function TarankaAbout() {
  return (
    <section className="bg-background py-16 font-taranka-body text-ink-900">
      <div className="mx-auto max-w-[1440px] px-[120px]">
        <h2 className="font-taranka-display text-[48px] font-extrabold uppercase leading-none">
          Sklep internetowy Taranka
        </h2>

        <div className="mt-[22px] space-y-[24px] text-base leading-[24px]">
          <p>
            &ldquo;Witamy w naszym sklepie z ukraińską żywnością w Warszawie i okolicach! Jesteśmy
            Twoim niezawodnym przewodnikiem po świecie smaku i autentycznej ukraińskiej żywności,
            sprowadzanej wprost z serca Ukrainy do stolicy Polski.
          </p>
          <p>
            W naszym asortymencie znajdziesz szeroką gamę produktów, które docenią prawdziwi fani
            kuchni ukraińskiej. Od tradycyjnego barszczu i wareników po ulubione słodycze —
            oferujemy najświeższe i najsmaczniejsze produkty od najlepszych ukraińskich
            producentów.
          </p>
        </div>

        <button
          type="button"
          className="group mt-[28px] inline-flex items-center font-taranka-display text-sm font-extrabold uppercase tracking-wide text-brand-red-500 transition-transform duration-300 hover:translate-x-1"
        >
          więcej
        </button>
      </div>
    </section>
  );
}
