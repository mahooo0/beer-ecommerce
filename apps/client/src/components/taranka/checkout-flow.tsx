'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { format, isSameDay, set, startOfDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { MapPin, Calendar as CalendarIcon, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth, useUser } from '@clerk/nextjs';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { CartItem } from '@repo/types';
import { useCheckoutItems } from '@/lib/checkout-cart';
import { formatZl } from '@/lib/product-mapper';
import { api } from '@/lib/api';
import { track, getSessionId, AnalyticsEventType } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { LockerMapLoader } from './locker-map-loader';
import { Button } from '@/components/shadcn/button';
import { Calendar } from '@/components/shadcn/calendar';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shadcn/popover';
import { Separator } from '@/components/shadcn/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type DeliveryTab = 'kurier' | 'wlasna' | 'poczta';

// Flat delivery fees (cents). Placeholder pricing until a shipping-rate service lands.
const DELIVERY_COST: Record<DeliveryTab, number> = {
  kurier: 1500,
  wlasna: 0,
  poczta: 1200,
};

interface DeliveryForm {
  city: string;
  street: string;
  house: string;
  apartment: string;
  postOffice: string;
}

const emptyDelivery: DeliveryForm = { city: '', street: '', house: '', apartment: '', postOffice: '' };

const steps = [
  { id: 1, key: 'delivery' },
  { id: 2, key: 'contact' },
  { id: 3, key: 'payment' },
];

const lockerCoords: [number, number][] = [
  [52.2297, 21.0122],
  [52.2401, 21.0362],
  [52.2189, 21.0008],
  [52.2456, 20.9985],
  [52.2305, 20.9876],
  [52.2511, 21.0234],
  [52.2102, 21.0301],
  [52.2378, 21.0451],
  [52.2256, 20.9762],
  [52.2589, 21.0156],
];

const lockers = lockerCoords.map((c, i) => ({
  id: i,
  name: 'FF, fil. Bałtyk, 1 Mai colt Suceava',
  phone: '0231-64-2-88',
  hours: 'Pon - Niedz, 08:00 - 22:00',
  lat: c[0],
  lng: c[1],
}));

const singleLocation = [lockers[0]!];

const cities = ['Warszawa', 'Kraków', 'Wrocław', 'Gdańsk', 'Poznań'];

const pillInput =
  'h-12 max-w-[280px] rounded-full border-[#B5B2A7] bg-white px-5 text-sm text-ink-900 shadow-none focus-visible:border-ink-900 focus-visible:ring-0';

const pillSelect =
  'h-12 w-full max-w-[280px] rounded-full border-[#B5B2A7] bg-white px-5 text-sm text-ink-900 shadow-none data-[placeholder]:text-[#9E9B90] focus:ring-0 focus:border-ink-900';

export function CheckoutFlow() {
  const { t } = useTranslation('checkout');
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const items = useCheckoutItems();

  const [step, setStep] = useState(1);
  const [tab, setTab] = useState<DeliveryTab>('kurier');
  const [selectedLocker, setSelectedLocker] = useState<number | null>(null);
  const [delivery, setDelivery] = useState<DeliveryForm>(emptyDelivery);
  const [contact, setContact] = useState({ name: '', company: '', email: '' });
  // Order + Stripe intent, created once and kept across step navigation so
  // stepping back and forth never spawns duplicate pending orders.
  const [intent, setIntent] = useState<{ orderId: string; clientSecret: string } | null>(null);

  // Prefill the email for signed-in customers (guests type their own).
  useEffect(() => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (email) setContact((c) => (c.email ? c : { ...c, email }));
  }, [user]);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
  const shippingCost = DELIVERY_COST[tab];
  const total = subtotal + shippingCost;

  // Funnel: fire checkout_started once, when the shopper actually reaches
  // checkout with items in the cart. The server compares this against paid
  // orders (same sessionId) to surface abandoned checkouts.
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (checkoutTracked.current || items.length === 0) return;
    checkoutTracked.current = true;
    track(AnalyticsEventType.CHECKOUT_STARTED, {
      itemCount: items.reduce((n, i) => n + i.quantity, 0),
      valueCents: items.reduce((s, i) => s + i.price * i.quantity, 0),
      email: contact.email || undefined,
    });
  }, [items, contact.email]);

  const next = () => setStep((s) => Math.min(3, s + 1));

  // Assemble the order payload from the delivery + contact forms. Only product
  // ids and quantities are sent for pricing — the server rebuilds the rest.
  const buildOrderPayload = () => {
    const parts = contact.name.trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] || '—';
    const lastName = parts.slice(1).join(' ') || '—';

    let street = '';
    if (tab === 'kurier') {
      street =
        [delivery.street, delivery.house].filter(Boolean).join(' ') +
        (delivery.apartment ? `/${delivery.apartment}` : '');
    } else if (tab === 'wlasna') {
      street = delivery.postOffice;
    } else if (tab === 'poczta' && selectedLocker != null) {
      street = lockers[selectedLocker]?.name ?? '';
    }

    return {
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      guestEmail: contact.email || undefined,
      sessionId: getSessionId(), // links the paid order back to the funnel session
      shippingAddress: {
        firstName,
        lastName,
        street: street || '—',
        city: delivery.city || '—',
        state: '',
        zipCode: '',
        country: 'PL',
        phone: '',
      },
      shipping: { method: tab, cost: shippingCost },
    };
  };

  if (items.length === 0) {
    return (
      <div className="rounded-[20px] bg-white p-12 text-center">
        <p className="text-base text-[#9E9B90]">{t('error.emptyCart')}</p>
      </div>
    );
  }

  return (
    <div className="font-taranka-body">
      <Stepper current={step} />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          {step === 1 && (
            <DeliveryStep
              tab={tab}
              onTabChange={setTab}
              delivery={delivery}
              onDeliveryChange={setDelivery}
              selectedLocker={selectedLocker}
              onLockerSelect={setSelectedLocker}
              onContinue={next}
            />
          )}

          {step === 2 && (
            <ContactStep
              contact={contact}
              onChange={setContact}
              onContinue={next}
              requireEmail={!isSignedIn}
            />
          )}

          {step === 3 && (
            <PaymentStep
              buildOrderPayload={buildOrderPayload}
              getToken={getToken}
              isSignedIn={!!isSignedIn}
              intent={intent}
              onReady={setIntent}
            />
          )}
        </div>

        <OrderSummary items={items} subtotal={subtotal} shippingCost={shippingCost} total={total} />
      </div>
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  const { t } = useTranslation('checkout');
  return (
    <div className="w-[587px] max-w-full mx-auto ">
      <ol className="flex items-center pb-10 ">
        {[1, 2, 3].map((n, i) => {
          const active = current === n;
          const passed = current > n;
          return (
            <li key={n} className="flex items-center" style={i < 2 ? { flex: 1 } : undefined}>
              <div className="relative">
                <span
                  className={`flex size-12 shrink-0 items-center justify-center rounded-full text-base font-medium transition-all ${
                    active || passed
                      ? 'bg-brand-red-500 text-cream-50'
                      : 'border-2 border-brand-red-500 text-brand-red-500'
                  }`}
                >
                  {n}
                </span>
                <p className="absolute bottom-[-30px] left-1/2 text-nowrap -translate-x-1/2 text-base font-medium text-ink-900">
                  {(active || passed) && steps[n] ? t(`step.${steps[n]!.key}`) : ''}
                </p>
              </div>

              {i < 2 && (
                <span
                  className="mx-3 flex-1 border-t-2 border-dotted"
                  style={{ borderColor: '#AA3C37' }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function OrderSummary({
  items,
  subtotal,
  shippingCost,
  total,
}: {
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
}) {
  const { t } = useTranslation('checkout');
  return (
    <aside className="h-fit rounded-[20px] bg-white p-6">
      <h2 className="font-taranka-display text-xl font-extrabold uppercase tracking-wide text-ink-900">
        {t('summary.heading')}
      </h2>

      <ul className="mt-5 space-y-3">
        {items.map((it) => (
          <li key={it.productId} className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={it.imageUrl || '/categories/product-chrupki.png'}
              alt={it.name}
              className="size-10 shrink-0 object-contain"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink-900">{it.name}</p>
              <p className="text-xs text-[#9E9B90]">× {it.quantity}</p>
            </div>
            <span className="whitespace-nowrap text-sm font-semibold text-ink-900">
              {formatZl(it.price * it.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 space-y-2 border-t border-cream-200 pt-4 text-sm">
        <div className="flex justify-between text-ink-900">
          <span>{t('summary.subtotal')}</span>
          <span>{formatZl(subtotal)}</span>
        </div>
        <div className="flex justify-between text-ink-900">
          <span>{t('summary.shipping')}</span>
          <span>{shippingCost === 0 ? t('summary.free') : formatZl(shippingCost)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between border-t border-cream-200 pt-4 text-base font-bold text-ink-900">
        <span>{t('summary.total')}</span>
        <span>{formatZl(total)}</span>
      </div>
    </aside>
  );
}

function DeliveryStep({
  tab,
  onTabChange,
  delivery,
  onDeliveryChange,
  selectedLocker,
  onLockerSelect,
  onContinue,
}: {
  tab: DeliveryTab;
  onTabChange: (t: DeliveryTab) => void;
  delivery: DeliveryForm;
  onDeliveryChange: (d: DeliveryForm) => void;
  selectedLocker: number | null;
  onLockerSelect: (id: number) => void;
  onContinue: () => void;
}) {
  return (
    <div className="rounded-[20px] bg-white p-6">
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="space-y-6">
          <DeliveryTabs current={tab} onChange={onTabChange} />

          {tab === 'kurier' && (
            <KurierForm delivery={delivery} onDeliveryChange={onDeliveryChange} onContinue={onContinue} />
          )}
          {tab === 'wlasna' && (
            <WlasnaForm delivery={delivery} onDeliveryChange={onDeliveryChange} onContinue={onContinue} />
          )}
          {tab === 'poczta' && (
            <PocztaForm
              delivery={delivery}
              onDeliveryChange={onDeliveryChange}
              selected={selectedLocker}
              onSelect={onLockerSelect}
              onContinue={onContinue}
            />
          )}
        </div>

        <div className="h-[400px] overflow-hidden rounded-[20px]">
          <LockerMapLoader
            lockers={tab === 'poczta' ? lockers : singleLocation}
            selectedId={tab === 'poczta' ? selectedLocker : null}
            onSelect={tab === 'poczta' ? onLockerSelect : undefined}
          />
        </div>
      </div>
    </div>
  );
}

function DeliveryTabs({
  current,
  onChange,
}: {
  current: DeliveryTab;
  onChange: (t: DeliveryTab) => void;
}) {
  const { t } = useTranslation('checkout');
  const tabs: { id: DeliveryTab }[] = [{ id: 'kurier' }, { id: 'wlasna' }, { id: 'poczta' }];
  return (
    <div className="flex items-center gap-8 border-b border-cream-300">
      {tabs.map((tab) => {
        const active = current === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative pb-3 font-taranka-display text-base font-extrabold uppercase tracking-wide transition-colors ${
              active ? 'text-ink-900' : 'text-[#9E9B90] hover:text-ink-900'
            }`}
          >
            {t(`tab.${tab.id}`)}
            <span
              className={`absolute inset-x-0 -bottom-px h-0.5 bg-brand-red-500 transition-transform ${
                active ? 'scale-x-100' : 'scale-x-0'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

function CityField({ value, onChange }: { value: string; onChange: (city: string) => void }) {
  const { t } = useTranslation('checkout');
  return (
    <Field label={t('form.city')}>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className={pillSelect + ' !h-12 !min-h-12'}>
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          {cities.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-normal text-ink-900">{label}</Label>
      {children}
    </div>
  );
}

function mergeDateAndTime(day: Date, time: string) {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return set(day, { hours, minutes, seconds: 0, milliseconds: 0 });
}

function DateField({ label }: { label: string }) {
  const { t } = useTranslation('checkout');
  const [value, setValue] = useState<Date>();
  const [open, setOpen] = useState(false);
  const [draftDay, setDraftDay] = useState<Date>();
  const [time, setTime] = useState('10:00');

  const minTime =
    draftDay && isSameDay(draftDay, new Date()) ? format(new Date(), 'HH:mm') : undefined;

  const apply = () => {
    if (!draftDay) return;
    const merged = mergeDateAndTime(draftDay, time);
    if (merged < new Date()) return;
    setValue(merged);
    setOpen(false);
  };

  return (
    <Field label={label}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            const base = value ?? new Date();
            setDraftDay(startOfDay(base));
            setTime(format(base, 'HH:mm'));
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              pillInput,
              'w-full max-w-[280px] justify-between font-normal hover:bg-white',
              !value && 'text-[#9E9B90]',
            )}
          >
            {value ? format(value, 'd MMMM yyyy, HH:mm', { locale: pl }) : '—'}
            <CalendarIcon className="size-4 shrink-0 text-ink-900" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={draftDay}
            onSelect={setDraftDay}
            disabled={{ before: startOfDay(new Date()) }}
          />
          <Separator />
          <div className="space-y-3 p-3">
            <div className="space-y-2">
              <Label className="text-xs font-normal text-ink-900">{t('form.time')}</Label>
              <Input
                type="time"
                value={time}
                min={minTime}
                onChange={(e) => setTime(e.target.value)}
                className="h-10 rounded-full border-[#B5B2A7] bg-white px-4 text-sm shadow-none focus-visible:border-ink-900 focus-visible:ring-0"
              />
            </div>
            <Button
              type="button"
              size="sm"
              className="h-9 w-full rounded-full bg-brand-red-500 text-cream-50 hover:bg-brand-red-700"
              disabled={!draftDay}
              onClick={apply}
            >
              {t('button.done')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </Field>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-12 w-[219px] items-center justify-center rounded-full bg-brand-red-500 text-base font-medium text-cream-50 shadow-[0_0_0_0_rgba(170,60,55,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-700 hover:shadow-[0_8px_24px_-4px_rgba(170,60,55,0.5)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
    >
      {children}
    </button>
  );
}

function KurierForm({
  delivery,
  onDeliveryChange,
  onContinue,
}: {
  delivery: DeliveryForm;
  onDeliveryChange: (d: DeliveryForm) => void;
  onContinue: () => void;
}) {
  const { t } = useTranslation('checkout');
  const valid = delivery.city && delivery.street.trim() && delivery.house.trim();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <CityField value={delivery.city} onChange={(city) => onDeliveryChange({ ...delivery, city })} />
        <Field label={t('form.street')}>
          <Input
            className={pillInput}
            value={delivery.street}
            onChange={(e) => onDeliveryChange({ ...delivery, street: e.target.value })}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="  flex flex-row gap-2 items-center">
          <Field label={t('form.house')}>
            <Input
              className={pillInput}
              value={delivery.house}
              onChange={(e) => onDeliveryChange({ ...delivery, house: e.target.value })}
            />
          </Field>
          <Field label={t('form.apartment')}>
            <Input
              className={pillInput}
              value={delivery.apartment}
              onChange={(e) => onDeliveryChange({ ...delivery, apartment: e.target.value })}
            />
          </Field>
        </div>
        <DateField label={t('form.dateTime')} />
      </div>
      <div className="pt-2">
        <PrimaryButton onClick={onContinue} disabled={!valid}>
          {t('button.continue')}
        </PrimaryButton>
      </div>
    </div>
  );
}

function WlasnaForm({
  delivery,
  onDeliveryChange,
  onContinue,
}: {
  delivery: DeliveryForm;
  onDeliveryChange: (d: DeliveryForm) => void;
  onContinue: () => void;
}) {
  const { t } = useTranslation('checkout');
  const valid = delivery.city && delivery.postOffice.trim();
  return (
    <div className="space-y-4">
      <CityField value={delivery.city} onChange={(city) => onDeliveryChange({ ...delivery, city })} />
      <Field label={t('form.postOfficeNumber')}>
        <Input
          className={pillInput}
          value={delivery.postOffice}
          onChange={(e) => onDeliveryChange({ ...delivery, postOffice: e.target.value })}
        />
      </Field>
      <div className="pt-2">
        <PrimaryButton onClick={onContinue} disabled={!valid}>
          {t('button.continue')}
        </PrimaryButton>
      </div>
    </div>
  );
}

function PocztaForm({
  delivery,
  onDeliveryChange,
  selected,
  onSelect,
  onContinue,
}: {
  delivery: DeliveryForm;
  onDeliveryChange: (d: DeliveryForm) => void;
  selected: number | null;
  onSelect: (id: number) => void;
  onContinue: () => void;
}) {
  const { t } = useTranslation('checkout');
  const valid = delivery.city && selected !== null;
  return (
    <div>
      <CityField value={delivery.city} onChange={(city) => onDeliveryChange({ ...delivery, city })} />

      <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
        {lockers.map((l) => (
          <li key={l.id}>
            <button
              type="button"
              onClick={() => onSelect(l.id)}
              className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                selected === l.id
                  ? 'border-brand-red-500 bg-brand-red-500/5'
                  : 'border-transparent hover:border-cream-300'
              }`}
            >
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-red-500" strokeWidth={2} />
              <div className="space-y-0.5 text-xs leading-tight text-ink-900">
                <p>{l.name}</p>
                <p>{l.phone}</p>
                <p>{l.hours}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <PrimaryButton onClick={onContinue} disabled={!valid}>
          {t('button.continue')}
        </PrimaryButton>
      </div>
    </div>
  );
}

function ContactStep({
  contact,
  onChange,
  onContinue,
  requireEmail,
}: {
  contact: { name: string; company: string; email: string };
  onChange: (c: { name: string; company: string; email: string }) => void;
  onContinue: () => void;
  requireEmail: boolean;
}) {
  const { t } = useTranslation('checkout');
  const isValid = contact.name.trim() && (!requireEmail || contact.email.trim());
  return (
    <div className="w-fit rounded-[20px] bg-white p-6 flex flex-col mx-auto">
      <div className="space-y-4 flex flex-col gap-4 ">
        <Field label={t('form.fullName')}>
          <Input
            placeholder={t('form.namePlaceholder')}
            value={contact.name}
            onChange={(e) => onChange({ ...contact, name: e.target.value })}
            className={pillInput + ' w-[370px]'}
          />
        </Field>
        <Field label={t('form.companyName')}>
          <Input
            placeholder={t('form.companyPlaceholder')}
            value={contact.company}
            onChange={(e) => onChange({ ...contact, company: e.target.value })}
            className={pillInput + ' w-[370px]'}
          />
        </Field>
        <Field label={t('form.email')}>
          <Input
            type="email"
            placeholder={t('form.emailPlaceholder')}
            value={contact.email}
            onChange={(e) => onChange({ ...contact, email: e.target.value })}
            className={pillInput + ' w-[370px]'}
          />
        </Field>
      </div>
      <div className="mt-6">
        <PrimaryButton onClick={onContinue} disabled={!isValid}>
          {t('button.confirm')}
        </PrimaryButton>
      </div>
    </div>
  );
}

function PaymentStep({
  buildOrderPayload,
  getToken,
  isSignedIn,
  intent,
  onReady,
}: {
  buildOrderPayload: () => Record<string, unknown>;
  getToken: () => Promise<string | null>;
  isSignedIn: boolean;
  intent: { orderId: string; clientSecret: string } | null;
  onReady: (intent: { orderId: string; clientSecret: string }) => void;
}) {
  const { t } = useTranslation('checkout');
  const [loading, setLoading] = useState(!intent);
  const [error, setError] = useState('');

  // Create the pending order + Stripe intent once. The charge amount is fixed
  // server-side from the order, so nothing sent from here is trusted.
  useEffect(() => {
    if (intent) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = isSignedIn ? (await getToken()) ?? undefined : undefined;
        const orderRes = await api.orders.create(buildOrderPayload() as never, token);
        if (!orderRes.success || !orderRes.data) throw new Error('order');
        const oid =
          (orderRes.data as { _id?: string; id?: string })._id ||
          (orderRes.data as { id?: string }).id;
        if (!oid) throw new Error('order-id');

        const intentRes = await api.payments.createIntent({ orderId: oid }, token);
        if (!intentRes.success || !intentRes.data) throw new Error('intent');

        if (cancelled) return;
        onReady({ orderId: oid, clientSecret: intentRes.data.clientSecret });
      } catch {
        if (!cancelled) setError(t('error.payment'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="rounded-[20px] bg-white p-6">
        <div className="h-48 animate-pulse rounded-2xl bg-cream-200" />
      </div>
    );
  }

  if (error || !intent) {
    return (
      <div className="rounded-[20px] bg-white p-6">
        <p className="text-sm text-brand-red-500">{error || t('error.payment')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] bg-white p-6">
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret: intent.clientSecret,
          locale: 'pl',
          appearance: {
            theme: 'flat',
            variables: {
              colorPrimary: '#AA3C37',
              borderRadius: '12px',
              fontFamily: 'inherit',
            },
          },
        }}
      >
        <StripeForm orderId={intent.orderId} />
      </Elements>
    </div>
  );
}

function StripeForm({ orderId }: { orderId: string }) {
  const { t } = useTranslation('checkout');
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError('');
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?orderId=${orderId}`,
      },
    });
    // On success Stripe redirects to return_url; only errors return here.
    if (confirmError) {
      setError(confirmError.message || t('error.generic'));
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PaymentElement />
      {error && <p className="text-sm text-brand-red-500">{error}</p>}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handlePay}
          disabled={!stripe || submitting}
          className="inline-flex h-12 items-center gap-3 rounded-full bg-brand-red-500 px-9 text-base font-medium text-cream-50 shadow-[0_0_0_0_rgba(170,60,55,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-700 hover:shadow-[0_8px_24px_-4px_rgba(170,60,55,0.5)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {submitting ? t('error.processing') : t('button.payAndOrder')}
          {!submitting && <Check className="size-4" strokeWidth={2.5} />}
        </button>
      </div>
    </div>
  );
}
