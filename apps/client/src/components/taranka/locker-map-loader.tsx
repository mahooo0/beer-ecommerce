"use client";

import dynamic from "next/dynamic";
import type { Locker } from "./locker-map";

const LockerMap = dynamic(() => import("./locker-map").then((m) => m.LockerMap), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center rounded-[20px] bg-cream-200 text-sm text-[#9E9B90]">
      Ładowanie mapy…
    </div>
  ),
});

export function LockerMapLoader(props: {
  lockers: Locker[];
  selectedId: number | null;
  onSelect?: (id: number) => void;
}) {
  return <LockerMap {...props} />;
}

export type { Locker };
