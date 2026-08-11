'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Search, X } from 'lucide-react';
import type { BlogLocale } from '@/lib/blog-api';

/**
 * Blog search box → navigates to /[lang]/blog?q=... (server does the querying).
 * Receives plain string labels only — a client component can't take the
 * function-bearing BlogStrings object across the server boundary.
 */
export function BlogSearch({
  lang,
  initialQuery,
  placeholder,
  label,
  submitLabel,
  clearLabel,
}: {
  lang: BlogLocale;
  initialQuery: string;
  placeholder: string;
  label: string;
  submitLabel: string;
  clearLabel: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/${lang}/blog?q=${encodeURIComponent(q)}` : `/${lang}/blog`);
  };

  const clear = () => {
    setValue('');
    router.push(`/${lang}/blog`);
  };

  return (
    <form onSubmit={submit} role="search" className="mt-6 flex max-w-md items-center gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#6b5750]" strokeWidth={1.75} />
        <input
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label={label}
          className="w-full rounded-full border border-black/10 bg-white py-2.5 pl-11 pr-10 text-[15px] text-[#2b1d18] outline-none transition-colors focus:border-brand-red-500"
        />
        {value ? (
          <button
            type="button"
            onClick={clear}
            aria-label={clearLabel}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b5750] hover:text-brand-red-500"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>
      <button
        type="submit"
        className="rounded-full bg-brand-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        {submitLabel}
      </button>
    </form>
  );
}
