'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth, useUser } from '@clerk/nextjs';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { CartItem, PickupPoint } from '@repo/types';
import { useCheckoutItems } from '@/lib/checkout-cart';
import { useCartQuote } from '@/lib/use-cart-quote';
import { formatZl } from '@/lib/product-mapper';
import { api, type SavedPhone } from '@/lib/api';
import { track, getSessionId, AnalyticsEventType } from '@/lib/analytics';
import { fromE164, isValidPhone, type PhoneCountry } from '@/lib/phone';
import { LockerMapLoader, type Locker } from './locker-map-loader';
import { PhoneField } from './phone-field';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Selectable methods actually sent to the server. Options shown but not yet live
// (paczkomat delivery, BLIK payment) are rendered as disabled "coming soon" tabs
// and never become one of these values.
type DeliveryMethod = 'kurier' | 'pickup';
type PaymentMethod = 'online' | 'cod';

// Flat delivery fees (cents). Placeholder pricing until a shipping-rate service
// lands; self-pickup is free.
const DELIVERY_COST: Record<DeliveryMethod, number> = {
  kurier: 1500,
  pickup: 0,
};

interface DeliveryForm {
  city: string;
  street: string;
  building: string; // dom / numer budynku
  block: string; // blok / klatka
  floor: string; // piętro
  door: string; // drzwi / nr mieszkania
}

const emptyDelivery: DeliveryForm = { city: '', street: '', building: '', block: '', floor: '', door: '' };

interface PhoneState {
  national: string;
  country: PhoneCountry;
  e164: string;
  valid: boolean;
}

const steps = [
  { id: 1, key: 'delivery' },
  { id: 2, key: 'contact' },
  { id: 3, key: 'payment' },
];

const pillInput =
  'h-12 w-full rounded-full border-[#B5B2A7] bg-white px-5 text-sm text-ink-900 shadow-none focus-visible:border-ink-900 focus-visible:ring-0';

interface MethodTab {
  id: string;
  label: string;
  /** Not yet available — shown greyed out with a "coming soon" badge, unclickable. */
  disabled?: boolean;
  badge?: string;
}

/**
 * Shared underline tab row for the delivery (step 1) and payment (step 3)
 * method pickers — no icons, single active underline, optional "coming soon"
 * badge on disabled options.
 */
function MethodTabs({
  tabs,
  current,
  onSelect,
}: {
  tabs: MethodTab[];
  current: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-cream-300">
      {tabs.map((tab) => {
        const active = current === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            aria-disabled={tab.disabled}
            onClick={() => !tab.disabled && onSelect(tab.id)}
            className={`relative flex items-center gap-2 pb-3 font-taranka-display text-base font-extrabold uppercase tracking-wide transition-colors ${
              tab.disabled
                ? 'cursor-not-allowed text-[#C7C4B9]'
                : active
                  ? 'text-ink-900'
                  : 'text-[#9E9B90] hover:text-ink-900'
            }`}
          >
            {tab.label}
            {tab.badge && (
              <span className="rounded-full bg-cream-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-normal text-[#9E9B90]">
                {tab.badge}
              </span>
            )}
            <span
              className={`absolute inset-x-0 -bottom-px h-0.5 bg-brand-red-500 transition-transform ${
                active && !tab.disabled ? 'scale-x-100' : 'scale-x-0'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

export function CheckoutFlow() {
  const { t } = useTranslation('checkout');
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const items = useCheckoutItems();

  const [step, setStep] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('kurier');
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [pickupPointId, setPickupPointId] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<DeliveryForm>(emptyDelivery);
  const [contact, setContact] = useState({ name: '', company: '', email: '' });

  // Phone: E.164 + validity are the authoritative values sent with the order.
  // A single editable field, prefilled with the buyer's last-used number.
  const [phone, setPhone] = useState<PhoneState>({ national: '', country: 'PL', e164: '', valid: false });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');
  // Order + Stripe intent, created once and kept across step navigation so
  // stepping back and forth never spawns duplicate pending orders.
  const [intent, setIntent] = useState<{ orderId: string; clientSecret: string } | null>(null);

  // Load active pickup points for the self-pickup selector.
  useEffect(() => {
    let cancelled = false;
    api.pickupPoints
      .getActive()
      .then((res) => {
        if (!cancelled && res.success && res.data) setPickupPoints(res.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Prefill the email for signed-in customers (guests type their own).
  useEffect(() => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (email) setContact((c) => (c.email ? c : { ...c, email }));
  }, [user]);

  // Prefill the single phone field from a saved number; the buyer can still edit it.
  const prefillPhone = (p: SavedPhone) => {
    const parsed = fromE164(p.phone);
    setPhone({ national: parsed.national, country: parsed.country, e164: p.phone, valid: true });
  };

  // Load saved phones for signed-in buyers; prefill the field from the primary
  // (last-used) saved number, or failing that the Clerk profile phone.
  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const res = await api.phones.list(token);
        const list = res.data ?? [];
        if (cancelled) return;
        if (list.length) {
          prefillPhone(list.find((p) => p.isPrimary) ?? list[0]!);
        } else {
          const clerkPhone = user?.primaryPhoneNumber?.phoneNumber;
          if (clerkPhone) {
            const parsed = fromE164(clerkPhone);
            setPhone({
              national: parsed.national,
              country: parsed.country,
              e164: clerkPhone,
              valid: isValidPhone(parsed.country, parsed.national),
            });
          }
        }
      } catch {
        /* not signed in / no phones — guest input path */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, user]);

  const localSubtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
  const shippingCost = DELIVERY_COST[deliveryMethod];
  // Server-authoritative discount preview (loyalty for retail, tier savings for
  // wholesale) so the summary total matches what Stripe/the order will charge.
  // Subtotal + discount come from the same (server) source once the quote lands;
  // before that we render the locally-computed subtotal with no discount.
  const quote = useCartQuote(items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
  const subtotal = quote?.subtotal ?? localSubtotal;
  const discountAmount = quote?.discountAmount ?? 0;
  const discountPercent = quote?.discountPercent ?? 0;
  const wholesaleSavings = quote?.wholesaleSavings ?? 0;
  const total = subtotal - discountAmount + shippingCost;

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
  const buildOrderPayload = (method: PaymentMethod) => {
    const parts = contact.name.trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] || '—';
    const lastName = parts.slice(1).join(' ') || '—';

    let street = '';
    let city = '';
    let building: string | undefined;
    let block: string | undefined;
    let floor: string | undefined;
    let door: string | undefined;

    if (deliveryMethod === 'kurier') {
      building = delivery.building || undefined;
      block = delivery.block || undefined;
      floor = delivery.floor || undefined;
      door = delivery.door || undefined;
      // A human-readable single line for the admin, plus the structured parts.
      street =
        [delivery.street, delivery.building].filter(Boolean).join(' ') +
        (delivery.door ? `/${delivery.door}` : '');
      city = delivery.city;
    } else {
      const p = pickupPoints.find((pp) => pp.id === pickupPointId);
      street = p ? [p.name, p.address].filter(Boolean).join(', ') : '—';
      city = p?.city || '—';
    }

    return {
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      guestEmail: contact.email || undefined,
      sessionId: getSessionId(), // links the paid order back to the funnel session
      shippingAddress: {
        firstName,
        lastName,
        street: street || '—',
        city: city || '—',
        state: '',
        zipCode: '',
        country: 'PL',
        phone: phone.e164 || '',
        building,
        block,
        floor,
        door,
      },
      shipping: { method: deliveryMethod, cost: shippingCost },
      pickupPointId: deliveryMethod === 'pickup' ? pickupPointId ?? undefined : undefined,
      paymentMethod: method,
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
              method={deliveryMethod}
              onMethodChange={setDeliveryMethod}
              delivery={delivery}
              onDeliveryChange={setDelivery}
              pickupPoints={pickupPoints}
              pickupPointId={pickupPointId}
              onPickupSelect={setPickupPointId}
              onContinue={next}
            />
          )}

          {step === 2 && (
            <ContactStep
              contact={contact}
              onChange={setContact}
              requireEmail={!isSignedIn}
              phone={phone}
              onPhoneChange={setPhone}
              onContinue={next}
            />
          )}

          {step === 3 && (
            <PaymentStep
              paymentMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
              buildOrderPayload={buildOrderPayload}
              getToken={getToken}
              isSignedIn={!!isSignedIn}
              intent={intent}
              onReady={setIntent}
            />
          )}
        </div>

        <OrderSummary
          items={items}
          subtotal={subtotal}
          shippingCost={shippingCost}
          discountAmount={discountAmount}
          discountPercent={discountPercent}
          wholesaleSavings={wholesaleSavings}
          total={total}
        />
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
                  {(active || passed) && steps[n - 1] ? t(`step.${steps[n - 1]!.key}`) : ''}
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
  discountAmount,
  discountPercent,
  wholesaleSavings,
  total,
}: {
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  discountPercent: number;
  wholesaleSavings: number;
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
        {wholesaleSavings > 0 && (
          <div className="flex justify-between font-semibold text-[#188E55]">
            <span>{t('summary.wholesaleSavings')}</span>
            <span>−{formatZl(wholesaleSavings)}</span>
          </div>
        )}
        {discountAmount > 0 && (
          <div className="flex justify-between font-semibold text-[#188E55]">
            <span>
              {t('summary.discount')}
              {discountPercent > 0 ? ` (${discountPercent}%)` : ''}
            </span>
            <span>−{formatZl(discountAmount)}</span>
          </div>
        )}
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
  method,
  onMethodChange,
  delivery,
  onDeliveryChange,
  pickupPoints,
  pickupPointId,
  onPickupSelect,
  onContinue,
}: {
  method: DeliveryMethod;
  onMethodChange: (m: DeliveryMethod) => void;
  delivery: DeliveryForm;
  onDeliveryChange: (d: DeliveryForm) => void;
  pickupPoints: PickupPoint[];
  pickupPointId: string | null;
  onPickupSelect: (id: string) => void;
  onContinue: () => void;
}) {
  const { t } = useTranslation('checkout');
  const tabs: MethodTab[] = [
    { id: 'kurier', label: t('tab.kurier') },
    { id: 'pickup', label: t('tab.pickup') },
    { id: 'paczkomat', label: t('tab.paczkomat'), disabled: true, badge: t('badge.comingSoon') },
  ];
  return (
    <div className="rounded-[20px] bg-white p-6">
      <MethodTabs tabs={tabs} current={method} onSelect={(id) => onMethodChange(id as DeliveryMethod)} />

      {method === 'kurier' ? (
        <KurierForm delivery={delivery} onDeliveryChange={onDeliveryChange} onContinue={onContinue} />
      ) : (
        <PickupForm
          points={pickupPoints}
          selectedId={pickupPointId}
          onSelect={onPickupSelect}
          onContinue={onContinue}
        />
      )}
    </div>
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
  const valid = delivery.city.trim() && delivery.street.trim() && delivery.building.trim();
  const set = (patch: Partial<DeliveryForm>) => onDeliveryChange({ ...delivery, ...patch });
  return (
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('form.city')}>
          <Input className={pillInput} value={delivery.city} onChange={(e) => set({ city: e.target.value })} />
        </Field>
        <Field label={t('form.street')}>
          <Input className={pillInput} value={delivery.street} onChange={(e) => set({ street: e.target.value })} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label={t('form.building')}>
          <Input className={pillInput} value={delivery.building} onChange={(e) => set({ building: e.target.value })} />
        </Field>
        <Field label={t('form.block')}>
          <Input className={pillInput} value={delivery.block} onChange={(e) => set({ block: e.target.value })} />
        </Field>
        <Field label={t('form.floor')}>
          <Input className={pillInput} value={delivery.floor} onChange={(e) => set({ floor: e.target.value })} />
        </Field>
        <Field label={t('form.door')}>
          <Input className={pillInput} value={delivery.door} onChange={(e) => set({ door: e.target.value })} />
        </Field>
      </div>
      <div className="pt-2">
        <PrimaryButton onClick={onContinue} disabled={!valid}>
          {t('button.continue')}
        </PrimaryButton>
      </div>
    </div>
  );
}

function PickupForm({
  points,
  selectedId,
  onSelect,
  onContinue,
}: {
  points: PickupPoint[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onContinue: () => void;
}) {
  const { t } = useTranslation('checkout');
  const withCoords = points.filter((p) => p.latitude != null && p.longitude != null);
  const mapLockers: Locker[] = withCoords.map((p, i) => ({
    id: i,
    name: p.name,
    phone: p.phone ?? '',
    hours: p.note ?? p.address,
    lat: p.latitude as number,
    lng: p.longitude as number,
  }));
  const selectedMapIndex = withCoords.findIndex((p) => p.id === selectedId);

  if (points.length === 0) {
    return <p className="mt-6 text-sm text-[#9E9B90]">{t('pickup.empty')}</p>;
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <p className="mb-3 text-sm font-medium text-ink-900">{t('pickup.select')}</p>
        <ul className="space-y-3">
          {points.map((p) => {
            const active = selectedId === p.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onSelect(p.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                    active
                      ? 'border-brand-red-500 bg-brand-red-500/5'
                      : 'border-cream-300 hover:border-brand-red-500/50'
                  }`}
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-brand-red-500" strokeWidth={2} />
                  <div className="space-y-0.5 text-xs leading-tight text-ink-900">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p>
                      {p.city}
                      {p.address ? `, ${p.address}` : ''}
                    </p>
                    {p.phone && <p className="text-[#9E9B90]">{p.phone}</p>}
                    {p.note && <p className="text-[#9E9B90]">{p.note}</p>}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="pt-5">
          <PrimaryButton onClick={onContinue} disabled={!selectedId}>
            {t('button.continue')}
          </PrimaryButton>
        </div>
      </div>

      {mapLockers.length > 0 && (
        <div className="h-[400px] overflow-hidden rounded-[20px]">
          <LockerMapLoader
            lockers={mapLockers}
            selectedId={selectedMapIndex >= 0 ? selectedMapIndex : null}
            onSelect={(i) => {
              const p = withCoords[i];
              if (p) onSelect(p.id);
            }}
          />
        </div>
      )}
    </div>
  );
}

function ContactStep({
  contact,
  onChange,
  requireEmail,
  phone,
  onPhoneChange,
  onContinue,
}: {
  contact: { name: string; company: string; email: string };
  onChange: (c: { name: string; company: string; email: string }) => void;
  requireEmail: boolean;
  phone: PhoneState;
  onPhoneChange: (p: PhoneState) => void;
  onContinue: () => void;
}) {
  const { t } = useTranslation('checkout');
  const isValid =
    contact.name.trim() && (!requireEmail || contact.email.trim()) && phone.valid;

  return (
    <div className="w-full rounded-[20px] bg-white p-6">
      {/* Two inputs per row: [name | company], [email | phone]. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('form.fullName')}>
          <Input
            placeholder={t('form.namePlaceholder')}
            value={contact.name}
            onChange={(e) => onChange({ ...contact, name: e.target.value })}
            className={pillInput}
          />
        </Field>
        <Field label={t('form.companyName')}>
          <Input
            placeholder={t('form.companyPlaceholder')}
            value={contact.company}
            onChange={(e) => onChange({ ...contact, company: e.target.value })}
            className={pillInput}
          />
        </Field>
        <Field label={t('form.email')}>
          <Input
            type="email"
            placeholder={t('form.emailPlaceholder')}
            value={contact.email}
            onChange={(e) => onChange({ ...contact, email: e.target.value })}
            className={pillInput}
          />
        </Field>

        <div className="space-y-2">
          <Label className="text-sm font-normal text-ink-900">{t('form.phone')}</Label>
          <PhoneField
            value={phone.national}
            country={phone.country}
            invalid={!!phone.national && !phone.valid}
            onChange={(national, country, e164, valid) =>
              onPhoneChange({ national, country, e164, valid })
            }
          />
          {!!phone.national && !phone.valid && (
            <p className="text-xs text-brand-red-500">{t('phone.invalid')}</p>
          )}
        </div>
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
  paymentMethod,
  onMethodChange,
  buildOrderPayload,
  getToken,
  isSignedIn,
  intent,
  onReady,
}: {
  paymentMethod: PaymentMethod;
  onMethodChange: (m: PaymentMethod) => void;
  buildOrderPayload: (method: PaymentMethod) => Record<string, unknown>;
  getToken: () => Promise<string | null>;
  isSignedIn: boolean;
  intent: { orderId: string; clientSecret: string } | null;
  onReady: (intent: { orderId: string; clientSecret: string }) => void;
}) {
  const { t } = useTranslation('checkout');
  const tabs: MethodTab[] = [
    { id: 'online', label: t('payment.online') },
    { id: 'cod', label: t('payment.cod') },
    { id: 'blik', label: t('payment.blik'), disabled: true, badge: t('badge.comingSoon') },
  ];

  return (
    <div className="rounded-[20px] bg-white p-6">
      <MethodTabs tabs={tabs} current={paymentMethod} onSelect={(id) => onMethodChange(id as PaymentMethod)} />
      <p className="mt-4 text-sm text-[#9E9B90]">{t(`payment.${paymentMethod}Desc`)}</p>

      <div className="mt-6 border-t border-cream-200 pt-6">
        {paymentMethod === 'online' ? (
          <OnlinePayment
            buildOrderPayload={buildOrderPayload}
            getToken={getToken}
            isSignedIn={isSignedIn}
            intent={intent}
            onReady={onReady}
          />
        ) : (
          <OfflinePayment
            method={paymentMethod}
            buildOrderPayload={buildOrderPayload}
            getToken={getToken}
            isSignedIn={isSignedIn}
          />
        )}
      </div>
    </div>
  );
}

function OnlinePayment({
  buildOrderPayload,
  getToken,
  isSignedIn,
  intent,
  onReady,
}: {
  buildOrderPayload: (method: PaymentMethod) => Record<string, unknown>;
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
        const orderRes = await api.orders.create(buildOrderPayload('online') as never, token);
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
    return <div className="h-48 animate-pulse rounded-2xl bg-cream-200" />;
  }

  if (error || !intent) {
    return <p className="text-sm text-brand-red-500">{error || t('error.payment')}</p>;
  }

  return (
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
  );
}

function OfflinePayment({
  method,
  buildOrderPayload,
  getToken,
  isSignedIn,
}: {
  method: Exclude<PaymentMethod, 'online'>;
  buildOrderPayload: (method: PaymentMethod) => Record<string, unknown>;
  getToken: () => Promise<string | null>;
  isSignedIn: boolean;
}) {
  const { t } = useTranslation('checkout');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const placeOrder = async () => {
    setSubmitting(true);
    setError('');
    try {
      const token = isSignedIn ? (await getToken()) ?? undefined : undefined;
      const res = await api.orders.create(buildOrderPayload(method) as never, token);
      if (!res.success || !res.data) throw new Error('order');
      const oid =
        (res.data as { _id?: string; id?: string })._id || (res.data as { id?: string }).id;
      // No Stripe redirect for offline methods — go straight to the confirmation,
      // which shows the receipt (by order id), method-specific instructions, and
      // clears the cart.
      const qs = new URLSearchParams({ method, ...(oid ? { orderId: oid } : {}) });
      window.location.href = `/checkout/success?${qs.toString()}`;
    } catch {
      setError(t('error.generic'));
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-brand-red-500">{error}</p>}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={placeOrder}
          disabled={submitting}
          className="inline-flex h-12 items-center gap-3 rounded-full bg-brand-red-500 px-9 text-base font-medium text-cream-50 shadow-[0_0_0_0_rgba(170,60,55,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-700 hover:shadow-[0_8px_24px_-4px_rgba(170,60,55,0.5)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {submitting ? t('error.processing') : t('payment.placeOrder')}
          {!submitting && <Check className="size-4" strokeWidth={2.5} />}
        </button>
      </div>
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
      {/* Card only: the intent is pinned to payment_method_types:['card'] server-side,
          and wallets are suppressed so the online tab is strictly the card form
          (BLIK lives as a disabled "coming soon" tab, not a payable method here). */}
      <PaymentElement options={{ wallets: { applePay: 'never', googlePay: 'never' } }} />
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
