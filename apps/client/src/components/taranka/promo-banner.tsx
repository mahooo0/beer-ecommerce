import Link from "next/link";
import { HeroArrowIcon, HeroWavesIcon } from "./icons";

export function TarankaPromoBanner() {
  return (
    <section
      className="relative h-[400px] w-full overflow-hidden bg-[#2a2622] bg-cover bg-center bg-no-repeat font-taranka-body text-cream-50"
      style={{ backgroundImage: "url(/wood-bg.png)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/book-ridna-ukraina.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-full w-auto -translate-x-[720px] object-contain object-left"
      />

      <div className="relative z-10 mx-auto flex h-full w-fit max-w-[1440px] flex-col pl-[631px] pt-[54px]">
        <h2 className="font-taranka-display text-[48px] font-extrabold uppercase leading-[58px]">
          <span className="block text-[#E13B3C]">Słodycze</span>
          <span className="block text-[#E13B3C]">&ldquo;Rodzima Ukraina&rdquo;</span>
          <span className="block text-cream-50">Za jedyne 45 zł</span>
        </h2>

        <p className="mt-[10px] text-[20px] font-medium leading-[26px] text-cream-50">
          Jeden z najpopularniejszych produktów w naszym sklepie.
          <br />
          Idealny na symboliczny prezent.
        </p>

        <div className="mt-[14px] flex gap-6">
          <Link
            href="/products"
            className="group inline-flex h-12 w-[249px] items-center justify-center gap-3 whitespace-nowrap rounded-full bg-brand-red-500 px-6 text-base font-medium text-cream-50 shadow-[0_0_0_0_rgba(170,60,55,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-700 hover:shadow-[0_8px_24px_-4px_rgba(170,60,55,0.5)] active:translate-y-0"
          >
            Dowiedz się więcej
            <HeroArrowIcon className="h-3 w-[35px] transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/products"
            className="group inline-flex h-12 w-[248px] items-center justify-center gap-3 whitespace-nowrap rounded-full border border-cream-50 px-6 text-base font-medium text-cream-50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-cream-50 hover:text-ink-900 active:translate-y-0"
          >
            Dowiedz się więcej
            <HeroWavesIcon className="h-[19px] w-[35px] transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
