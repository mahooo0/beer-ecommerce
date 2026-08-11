'use client';

import React, { useState } from 'react';
import { lexicalToPlain, type BlogLocale } from '@/lib/blog-api';
import { CMS_BASE_URL, type CmsForm, type CmsFormField } from '@/lib/pages-api';

/**
 * Renders a Payload form-builder form on the storefront and submits it to
 * `POST {CMS}/api/form-submissions` (anonymous create is enabled by the plugin).
 * Field labels/options come from the CMS (localized), so the same component
 * serves the Contact and Franchise-application forms in pl/uk.
 */

const UI: Record<BlogLocale, { submit: string; sending: string; error: string; thanks: string }> = {
  pl: {
    submit: 'Wyślij',
    sending: 'Wysyłanie…',
    error: 'Nie udało się wysłać. Spróbuj ponownie.',
    thanks: 'Dziękujemy! Skontaktujemy się z Tobą wkrótce.',
  },
  uk: {
    submit: 'Надіслати',
    sending: 'Надсилання…',
    error: 'Не вдалося надіслати. Спробуйте ще раз.',
    thanks: 'Дякуємо! Ми зв’яжемося з вами найближчим часом.',
  },
};

type Values = Record<string, string | boolean>;

const inputCls =
  'w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] text-ink-900 outline-none transition-colors focus:border-brand-red-500';

export function CmsForm({ form, lang }: { form: CmsForm; lang: BlogLocale }) {
  const t = UI[lang] ?? UI.pl;
  const fields = (form.fields ?? []).filter(Boolean);

  const [values, setValues] = useState<Values>(() => {
    const init: Values = {};
    for (const f of fields) {
      if (!f?.name) continue;
      init[f.name] = f.blockType === 'checkbox' ? Boolean(f.defaultValue) : String(f.defaultValue ?? '');
    }
    return init;
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const set = (name: string, value: string | boolean) => setValues((v) => ({ ...v, [name]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    try {
      const submissionData = fields
        .filter((f) => f?.name && f.blockType !== 'message')
        .map((f) => ({ field: f.name as string, value: values[f.name as string] ?? '' }));

      const res = await fetch(`${CMS_BASE_URL}/api/form-submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form: form.id, submissionData }),
      });
      if (!res.ok) throw new Error(`submit failed: ${res.status}`);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    const msg = lexicalToPlain(form.confirmationMessage) || t.thanks;
    return (
      <div className="rounded-2xl border border-green-300 bg-green-50 px-6 py-8 text-center text-[16px] text-green-900">
        {msg}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {fields.map((f, i) => (
        <Field key={f?.id ?? f?.name ?? i} field={f} value={values[f?.name ?? '']} onChange={set} />
      ))}

      {status === 'error' ? (
        <p className="text-[14px] text-red-600">{t.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="inline-flex items-center justify-center rounded-full bg-brand-red-500 px-8 py-3 font-taranka-display text-[15px] font-extrabold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === 'sending' ? t.sending : form.submitButtonLabel || t.submit}
      </button>
    </form>
  );
}

function Field({
  field,
  value,
  onChange,
}: {
  field: CmsFormField;
  value: string | boolean | undefined;
  onChange: (name: string, value: string | boolean) => void;
}) {
  if (!field) return null;

  // Display-only rich message block (not an input).
  if (field.blockType === 'message') {
    const text = lexicalToPlain(field.message);
    if (!text) return null;
    return <p className="text-[15px] leading-relaxed text-[#4a352e]">{text}</p>;
  }

  const name = field.name ?? '';
  const label = field.label ?? name;
  const required = Boolean(field.required);

  const Label = (
    <label htmlFor={name} className="mb-1.5 block font-taranka-display text-[13px] font-bold uppercase tracking-wide text-ink-900">
      {label}
      {required ? <span className="ml-0.5 text-brand-red-500">*</span> : null}
    </label>
  );

  if (field.blockType === 'checkbox') {
    return (
      <label className="flex cursor-pointer items-start gap-3 text-[15px] text-[#4a352e]">
        <input
          id={name}
          type="checkbox"
          checked={Boolean(value)}
          required={required}
          onChange={(e) => onChange(name, e.target.checked)}
          className="mt-1 h-4 w-4 accent-brand-red-500"
        />
        <span>
          {label}
          {required ? <span className="ml-0.5 text-brand-red-500">*</span> : null}
        </span>
      </label>
    );
  }

  if (field.blockType === 'textarea') {
    return (
      <div>
        {Label}
        <textarea
          id={name}
          rows={5}
          required={required}
          placeholder={field.placeholder ?? undefined}
          value={String(value ?? '')}
          onChange={(e) => onChange(name, e.target.value)}
          className={inputCls}
        />
      </div>
    );
  }

  if (field.blockType === 'select') {
    return (
      <div>
        {Label}
        <select
          id={name}
          required={required}
          value={String(value ?? '')}
          onChange={(e) => onChange(name, e.target.value)}
          className={inputCls}
        >
          <option value="">—</option>
          {(field.options ?? []).map((o, i) => (
            <option key={o?.value ?? i} value={o?.value ?? ''}>
              {o?.label ?? o?.value ?? ''}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const type = field.blockType === 'email' ? 'email' : field.blockType === 'number' ? 'number' : 'text';
  return (
    <div>
      {Label}
      <input
        id={name}
        type={type}
        required={required}
        placeholder={field.placeholder ?? undefined}
        value={String(value ?? '')}
        onChange={(e) => onChange(name, e.target.value)}
        className={inputCls}
      />
    </div>
  );
}
