'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2, Send, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/nextjs';
import { useCart } from '@/lib/cart-store';
import { CMS_BASE_URL } from '@/lib/pages-api';

/**
 * Wholesale "quick order" (Швидке замовлення / Szybkie zamówienie). Instead of
 * paying, a WHOLESALE customer assembles a request from the cart, leaves their
 * contacts + a note, and submits ONE inquiry. It lands in the Payload
 * form-submissions collection (form "Zamówienie hurtowe"), so the team sees it
 * in admin → Leads and calls back to finalise. Reuses the normal cart store.
 */

// Payload form id for "Zamówienie hurtowe" (created on the CMS). Override per
// environment via NEXT_PUBLIC_WHOLESALE_FORM_ID; defaults to the DEV id.
const FORM_ID = Number(process.env.NEXT_PUBLIC_WHOLESALE_FORM_ID) || 5;

type Lang = 'pl' | 'uk';
const UI: Record<Lang, Record<string, string>> = {
  pl: {
    title: 'Szybkie zamówienie',
    subtitle: 'Zostaw zapytanie — skontaktujemy się i dopniemy szczegóły.',
    empty: 'Twój koszyk jest pusty.',
    emptyCta: 'Przejdź do katalogu',
    positions: 'Pozycje',
    name: 'Imię i nazwisko',
    phone: 'Telefon',
    email: 'E-mail',
    comment: 'Komentarz (opcjonalnie)',
    commentPh: 'Np. preferowany termin dostawy, pytania…',
    submit: 'Wyślij zapytanie',
    sending: 'Wysyłanie…',
    success: 'Dziękujemy! Zapytanie wysłane — wkrótce się odezwiemy.',
    error: 'Nie udało się wysłać. Spróbuj ponownie.',
    perUnit: '/szt',
    pieces: 'szt',
    total: 'Razem (orientacyjnie)',
    required: 'Uzupełnij imię i telefon.',
  },
  uk: {
    title: 'Швидке замовлення',
    subtitle: 'Залиште заявку — зв’яжемося й узгодимо деталі.',
    empty: 'Ваш кошик порожній.',
    emptyCta: 'Перейти до каталогу',
    positions: 'Позиції',
    name: 'Ім’я та прізвище',
    phone: 'Телефон',
    email: 'E-mail',
    comment: 'Коментар (необов’язково)',
    commentPh: 'Напр. бажана дата доставки, питання…',
    submit: 'Надіслати заявку',
    sending: 'Надсилання…',
    success: 'Дякуємо! Заявку надіслано — скоро зв’яжемося.',
    error: 'Не вдалося надіслати. Спробуйте ще раз.',
    perUnit: '/шт',
    pieces: 'шт',
    total: 'Разом (орієнтовно)',
    required: 'Вкажіть ім’я та телефон.',
  },
};

const zl = (major: number) => `${major.toFixed(2)} zł`;

export function WholesaleQuickOrder() {
  const { i18n } = useTranslation();
  const lang: Lang = i18n.language?.startsWith('uk') ? 'uk' : 'pl';
  const t = UI[lang];

  const { user } = useUser();
  const items = useCart((s) => s.items);
  const updateQty = useCart((s) => s.updateQty);
  const setQty = useCart((s) => s.setQty);
  const removeItem = useCart((s) => s.removeItem);
  const clear = useCart((s) => s.clear);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  // Prefill contacts from the signed-in wholesale account (best effort).
  useEffect(() => {
    if (!user) return;
    setName((v) => v || user.fullName || '');
    setEmail((v) => v || user.primaryEmailAddress?.emailAddress || '');
    setPhone((v) => v || user.primaryPhoneNumber?.phoneNumber || '');
  }, [user]);

  const total = useMemo(() => items.reduce((s, it) => s + it.newPrice * it.qty, 0), [items]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    if (!name.trim() || !phone.trim()) {
      setStatus('error');
      return;
    }
    setStatus('sending');
    try {
      const pozycje = items
        .map((it) => `• ${it.name} — ${it.qty} ${t.pieces} (${zl(it.newPrice)}${t.perUnit})`)
        .join('\n');
      const res = await fetch(`${CMS_BASE_URL}/api/form-submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form: FORM_ID,
          submissionData: [
            { field: 'imie', value: name.trim() },
            { field: 'telefon', value: phone.trim() },
            { field: 'email', value: email.trim() },
            { field: 'pozycje', value: `${pozycje}\n\n= ${zl(total)}` },
            { field: 'komentarz', value: comment.trim() },
          ],
        }),
      });
      if (!res.ok) throw new Error(`submit failed: ${res.status}`);
      setStatus('done');
      clear();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="mx-auto max-w-[720px] rounded-3xl border border-green-300 bg-green-50 px-8 py-12 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-green-500 text-white">
          <Check className="size-7" strokeWidth={2.5} />
        </div>
        <p className="text-lg font-semibold text-green-900">{t.success}</p>
        <Link
          href="/products"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-brand-red-500 px-7 text-sm font-medium text-cream-50 transition-colors hover:bg-brand-red-700"
        >
          {t.emptyCta}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[860px]">
      <h1 className="font-taranka-display text-[40px] font-extrabold uppercase leading-none text-ink-900">
        {t.title}
      </h1>
      <p className="mt-2 text-[15px] text-[#6b5f57]">{t.subtitle}</p>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-black/10 bg-white px-6 py-12 text-center">
          <p className="text-[15px] text-[#6b5f57]">{t.empty}</p>
          <Link
            href="/products"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-brand-red-500 px-7 text-sm font-medium text-cream-50 transition-colors hover:bg-brand-red-700"
          >
            {t.emptyCta}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Items */}
          <div>
            <h2 className="mb-3 font-taranka-display text-sm font-bold uppercase tracking-wide text-ink-900">
              {t.positions}
            </h2>
            <ul className="divide-y divide-black/5 rounded-2xl border border-black/10 bg-white">
              {items.map((it) => (
                <li key={it.id} className="flex items-center gap-4 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={it.image}
                    alt={it.name}
                    className="size-14 shrink-0 rounded-lg object-contain"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-ink-900">{it.name}</p>
                    <p className="text-xs text-[#8a7d74]">
                      {zl(it.newPrice)}
                      {t.perUnit}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-black/10 p-1">
                    <button
                      type="button"
                      onClick={() => updateQty(it.id, -1)}
                      className="flex size-7 items-center justify-center rounded-full text-ink-900 transition-colors hover:bg-black/5"
                      aria-label="-"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={it.qty}
                      onChange={(e) => setQty(it.id, parseInt(e.target.value, 10) || 1)}
                      className="w-10 bg-transparent text-center text-sm font-semibold text-ink-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateQty(it.id, 1)}
                      className="flex size-7 items-center justify-center rounded-full text-ink-900 transition-colors hover:bg-black/5"
                      aria-label="+"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums text-ink-900">
                    {zl(it.newPrice * it.qty)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#b9aca3] transition-colors hover:bg-red-50 hover:text-red-500"
                    aria-label="remove"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between px-1 text-[15px]">
              <span className="text-[#6b5f57]">{t.total}</span>
              <span className="font-bold text-ink-900">{zl(total)}</span>
            </div>
          </div>

          {/* Contacts */}
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="space-y-4">
              <Field label={t.name} required value={name} onChange={setName} />
              <Field label={t.phone} required value={phone} onChange={setPhone} type="tel" />
              <Field label={t.email} value={email} onChange={setEmail} type="email" />
              <div>
                <label className="mb-1.5 block font-taranka-display text-[13px] font-bold uppercase tracking-wide text-ink-900">
                  {t.comment}
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t.commentPh}
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] text-ink-900 outline-none transition-colors focus:border-brand-red-500"
                />
              </div>
            </div>

            {status === 'error' && <p className="mt-3 text-[13px] text-red-600">{t.required}</p>}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-red-500 px-6 text-base font-medium text-cream-50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-700 disabled:opacity-60"
            >
              <Send className="size-4" />
              {status === 'sending' ? t.sending : t.submit}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block font-taranka-display text-[13px] font-bold uppercase tracking-wide text-ink-900">
        {label}
        {required && <span className="ml-0.5 text-brand-red-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] text-ink-900 outline-none transition-colors focus:border-brand-red-500"
      />
    </div>
  );
}
