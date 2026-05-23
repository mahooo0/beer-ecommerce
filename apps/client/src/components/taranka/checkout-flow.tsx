'use client';

import { useState } from 'react';
import { format, isSameDay, set, startOfDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { MapPin, Calendar as CalendarIcon, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-store';
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

type DeliveryTab = 'kurier' | 'wlasna' | 'poczta';

const steps = [
  { id: 1, label: 'Wybierz metodę dostawy' },
  { id: 2, label: 'Dane kontaktowe' },
  { id: 3, label: 'Metoda płatności' },
];

const payments = [
  { id: 'blik-1', label: 'BLIK' },
  { id: 'blik-2', label: 'BLIK' },
  { id: 'blik-3', label: 'BLIK' },
  { id: 'blik-4', label: 'BLIK' },
  { id: 'blik-5', label: 'BLIK' },
  { id: 'blik-6', label: 'BLIK' },
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
  const router = useRouter();
  const clear = useCart((s) => s.clear);
  const [step, setStep] = useState(1);
  const [tab, setTab] = useState<DeliveryTab>('kurier');
  const [selectedLocker, setSelectedLocker] = useState<number | null>(null);
  const [payment, setPayment] = useState<string>(payments[0]!.id);
  const [contact, setContact] = useState({ name: '', company: '', email: '' });

  const next = () => setStep((s) => Math.min(3, s + 1));
  const placeOrder = () => {
    clear();
    router.push('/checkout/success');
  };

  return (
    <div className="font-taranka-body">
      <Stepper current={step} />

      <div className="mt-8">
        {step === 1 && (
          <DeliveryStep
            tab={tab}
            onTabChange={setTab}
            selectedLocker={selectedLocker}
            onLockerSelect={setSelectedLocker}
            onContinue={next}
          />
        )}

        {step === 2 && <ContactStep contact={contact} onChange={setContact} onContinue={next} />}

        {step === 3 && (
          <PaymentStep selected={payment} onSelect={setPayment} onSubmit={placeOrder} />
        )}
      </div>
    </div>
  );
}

function Stepper({ current }: { current: number }) {
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
                  {active || passed ? steps[n]?.label : ''}
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

function DeliveryStep({
  tab,
  onTabChange,
  selectedLocker,
  onLockerSelect,
  onContinue,
}: {
  tab: DeliveryTab;
  onTabChange: (t: DeliveryTab) => void;
  selectedLocker: number | null;
  onLockerSelect: (id: number) => void;
  onContinue: () => void;
}) {
  return (
    <div className="rounded-[20px] bg-white p-6">
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="space-y-6">
          <DeliveryTabs current={tab} onChange={onTabChange} />

          {tab === 'kurier' && <KurierForm onContinue={onContinue} />}
          {tab === 'wlasna' && <WlasnaForm onContinue={onContinue} />}
          {tab === 'poczta' && (
            <PocztaForm
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
  const tabs: { id: DeliveryTab; label: string }[] = [
    { id: 'kurier', label: 'Kurier' },
    { id: 'wlasna', label: 'Dostawa własna' },
    { id: 'poczta', label: 'Maszyna pocztowa' },
  ];
  return (
    <div className="flex items-center gap-8 border-b border-cream-300">
      {tabs.map((t) => {
        const active = current === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`relative pb-3 font-taranka-display text-base font-extrabold uppercase tracking-wide transition-colors ${
              active ? 'text-ink-900' : 'text-[#9E9B90] hover:text-ink-900'
            }`}
          >
            {t.label}
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

function CityField() {
  return (
    <Field label="Miasto">
      <Select>
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
              <Label className="text-xs font-normal text-ink-900">Godzina</Label>
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
              Gotowe
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

function KurierForm({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <CityField />
        <Field label="Ulica">
          <Input className={pillInput} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="  flex flex-row gap-2 items-center">
          <Field label="Dom">
            <Input className={pillInput} />
          </Field>
          <Field label="Mieszkanie">
            <Input className={pillInput} />
          </Field>
        </div>
        <DateField label="Wybierz datę i godzinę" />
      </div>
      <div className="pt-2">
        <PrimaryButton onClick={onContinue}>kontynuować</PrimaryButton>
      </div>
    </div>
  );
}

function WlasnaForm({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="space-y-4">
      <CityField />
      <Field label="Numer urzędu pocztowego">
        <Input className={pillInput} />
      </Field>
      <div className="pt-2">
        <PrimaryButton onClick={onContinue}>kontynuować</PrimaryButton>
      </div>
    </div>
  );
}

function PocztaForm({
  selected,
  onSelect,
  onContinue,
}: {
  selected: number | null;
  onSelect: (id: number) => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <CityField />

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
        <PrimaryButton onClick={onContinue} disabled={selected === null}>
          kontynuować
        </PrimaryButton>
      </div>
    </div>
  );
}

function ContactStep({
  contact,
  onChange,
  onContinue,
}: {
  contact: { name: string; company: string; email: string };
  onChange: (c: { name: string; company: string; email: string }) => void;
  onContinue: () => void;
}) {
  const isValid = contact.name.trim() && contact.email.trim();
  return (
    <div className="w-fit rounded-[20px] bg-white p-6 flex flex-col mx-auto">
      <div className="space-y-4 flex flex-col gap-4 ">
        <Field label="Imię i nazwisko">
          <Input
            placeholder="Name"
            value={contact.name}
            onChange={(e) => onChange({ ...contact, name: e.target.value })}
            className={pillInput + ' w-[370px]'}
          />
        </Field>
        <Field label="Nazwa firmy">
          <Input
            placeholder="Nazwa firmy"
            value={contact.company}
            onChange={(e) => onChange({ ...contact, company: e.target.value })}
            className={pillInput + ' w-[370px]'}
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            placeholder="Email"
            value={contact.email}
            onChange={(e) => onChange({ ...contact, email: e.target.value })}
            className={pillInput + ' w-[370px]'}
          />
        </Field>
      </div>
      <div className="mt-6">
        <PrimaryButton onClick={onContinue} disabled={!isValid}>
          Potwierdzenie
        </PrimaryButton>
      </div>
    </div>
  );
}

function PaymentStep({
  selected,
  onSelect,
  onSubmit,
}: {
  selected: string;
  onSelect: (id: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <div className="rounded-[20px] bg-white p-6">
        <ul className="grid grid-cols-3 gap-6">
          {payments.map((p) => {
            const active = selected === p.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onSelect(p.id)}
                  className={`flex h-[88px] w-full items-center justify-between rounded-3xl border bg-white px-6 transition-colors ${
                    active ? 'border-brand-red-500' : 'border-cream-300 hover:border-ink-900'
                  }`}
                >
                  <span
                    className={`flex size-5 items-center justify-center rounded-full border-2 ${
                      active ? 'border-brand-red-500' : 'border-[#9E9B90]'
                    }`}
                  >
                    {active && <span className="size-2.5 rounded-full bg-brand-red-500" />}
                  </span>
                  <span className="flex h-12 items-center rounded bg-black px-4 font-taranka-display text-base font-bold uppercase text-white">
                    <span className="text-[#E91E63]">b</span>lik
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex h-12 items-center gap-3 rounded-full bg-brand-red-500 px-9 text-base font-medium text-cream-50 shadow-[0_0_0_0_rgba(170,60,55,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-700 hover:shadow-[0_8px_24px_-4px_rgba(170,60,55,0.5)]"
        >
          Zapłać i złóż zamówienie
          <Check className="size-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
