"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

interface Address {
  id: number;
  label: string;
  country: string;
  city: string;
  street: string;
  email: string;
  phone: string;
}

const initial: Address[] = [
  {
    id: 1,
    label: "Podstawowy",
    country: "Polska",
    city: "Warszawa",
    street: "ul. Sagaidachnego 5, m. 80",
    email: "6000987@gmail.com",
    phone: "+48 095 300 30 30",
  },
  ...Array.from({ length: 5 }, (_, i) => ({
    id: i + 2,
    label: "Biuro",
    country: "Polska",
    city: "Warszawa",
    street: "ul. Sagaidachnego 5, m. 80",
    email: "6000987@gmail.com",
    phone: "+48 095 300 30 30",
  })),
];

export function ProfileAddresses() {
  const [addresses, setAddresses] = useState<Address[]>(initial);

  const handleAdd = () => {
    setAddresses((prev) => [
      ...prev,
      {
        id: Date.now(),
        label: "Biuro",
        country: "Polska",
        city: "Warszawa",
        street: "ul. Sagaidachnego 5, m. 80",
        email: "6000987@gmail.com",
        phone: "+48 095 300 30 30",
      },
    ]);
  };

  const handleRemove = (id: number) =>
    setAddresses((prev) => prev.filter((a) => a.id !== id));

  return (
    <div className="flex-1 rounded-[20px] bg-white p-8 font-taranka-body">
      <div className="flex items-center justify-between">
        <h1 className="font-taranka-display text-2xl font-extrabold uppercase tracking-wide text-ink-900">
          Twoje adresy
        </h1>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex h-12 items-center gap-2 rounded-full border border-brand-red-500 px-6 text-base font-medium text-brand-red-500 transition-all hover:-translate-y-0.5 hover:bg-brand-red-500 hover:text-cream-50 active:translate-y-0"
        >
          <Plus className="size-4" strokeWidth={2} />
          Dodaj adres
        </button>
      </div>

      <ul className="mt-8 grid grid-cols-3 gap-x-6 gap-y-10">
        {addresses.map((a) => (
          <li key={a.id} className="text-base text-ink-900">
            <p className="font-semibold">{a.label}</p>
            <div className="mt-3 space-y-1 text-sm">
              <p>{a.country}</p>
              <p>{a.city}</p>
              <p>{a.street}</p>
              <p>{a.email}</p>
              <p>{a.phone}</p>
            </div>
            <div className="mt-4 flex gap-6 text-sm">
              <button
                type="button"
                className="text-brand-red-500 underline underline-offset-2 transition-colors hover:text-brand-red-700"
              >
                Edytuj
              </button>
              <button
                type="button"
                onClick={() => handleRemove(a.id)}
                className="text-brand-red-500 underline underline-offset-2 transition-colors hover:text-brand-red-700"
              >
                Usuń
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
