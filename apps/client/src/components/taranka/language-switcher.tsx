"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { persistLanguage } from "@/lib/i18n/language";
import {
  languageLabels,
  languages,
  isLanguage,
  type Language,
} from "@/lib/i18n/settings";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const current: Language = isLanguage(i18n.language) ? i18n.language : "pl";

  const change = (lng: Language) => {
    if (lng !== current) {
      void i18n.changeLanguage(lng);
      persistLanguage(lng);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={languageLabels[current].native}
          className="group flex items-center gap-1 text-sm font-medium text-cream-50 transition-colors hover:text-brand-red-500"
        >
          {languageLabels[current].short}
          <ChevronDown
            className="size-4 transition-transform duration-300 group-data-[state=open]:rotate-180"
            strokeWidth={1.75}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="z-[1100] w-44 rounded-2xl border-cream-300 bg-background p-1.5 font-taranka-body shadow-lg"
      >
        {languages.map((lng) => (
          <button
            key={lng}
            type="button"
            onClick={() => change(lng)}
            className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-ink-900 transition-colors hover:bg-[#F5F3EC]"
          >
            <span className="flex items-center gap-2">
              <span className="w-6 text-xs font-semibold text-ink-900/60">
                {languageLabels[lng].short}
              </span>
              {languageLabels[lng].native}
            </span>
            {lng === current && (
              <Check className="size-4 text-brand-red-500" strokeWidth={2} />
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
