"use client";

import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import type { Locker } from "./locker-map";

function MapLoading() {
  const { t } = useTranslation("checkout");
  return (
    <div className="flex size-full items-center justify-center rounded-[20px] bg-cream-200 text-sm text-[#9E9B90]">
      {t("map.loading")}
    </div>
  );
}

const LockerMap = dynamic(() => import("./locker-map").then((m) => m.LockerMap), {
  ssr: false,
  loading: () => <MapLoading />,
});

export function LockerMapLoader(props: {
  lockers: Locker[];
  selectedId: number | null;
  onSelect?: (id: number) => void;
}) {
  return <LockerMap {...props} />;
}

export type { Locker };
