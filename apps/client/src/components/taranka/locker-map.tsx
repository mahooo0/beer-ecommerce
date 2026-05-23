"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export interface Locker {
  id: number;
  name: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
}

const activeIcon = L.divIcon({
  className: "",
  html: `<div style="
    width: 32px; height: 32px;
    background: #AA3C37;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(170,60,55,0.4);
  "><div style="
    width: 8px; height: 8px;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 9px; left: 9px;
  "></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const inactiveIcon = L.divIcon({
  className: "",
  html: `<div style="
    width: 24px; height: 24px;
    background: #AA3C37;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 2px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    opacity: 0.85;
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

function FlyTo({
  lockers,
  selectedId,
}: {
  lockers: Locker[];
  selectedId: number | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (selectedId === null) return;
    const target = lockers.find((l) => l.id === selectedId);
    if (target) map.flyTo([target.lat, target.lng], 15, { duration: 0.8 });
  }, [selectedId, lockers, map]);
  return null;
}

export function LockerMap({
  lockers,
  selectedId,
  onSelect,
}: {
  lockers: Locker[];
  selectedId: number | null;
  onSelect?: (id: number) => void;
}) {
  const markerRefs = useRef<Record<number, L.Marker | null>>({});

  useEffect(() => {
    if (selectedId === null) return;
    const m = markerRefs.current[selectedId];
    if (m) {
      setTimeout(() => m.openPopup(), 800);
    }
  }, [selectedId]);

  const center: [number, number] =
    selectedId !== null
      ? [lockers.find((l) => l.id === selectedId)?.lat ?? 52.2297, lockers.find((l) => l.id === selectedId)?.lng ?? 21.0122]
      : [lockers[0]?.lat ?? 52.2297, lockers[0]?.lng ?? 21.0122];

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={false}
      className="size-full rounded-[20px]"
    >
      <TileLayer
        attribution="© OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyTo lockers={lockers} selectedId={selectedId} />
      {lockers.map((l) => (
        <Marker
          key={l.id}
          position={[l.lat, l.lng]}
          icon={selectedId === l.id ? activeIcon : inactiveIcon}
          ref={(m) => {
            markerRefs.current[l.id] = m;
          }}
          eventHandlers={{
            click: () => onSelect?.(l.id),
          }}
        >
          <Popup>
            <div style={{ fontFamily: "Montserrat, sans-serif", lineHeight: 1.4 }}>
              <strong style={{ color: "#272423" }}>Taranka market</strong>
              <br />
              <span style={{ color: "#443029", fontSize: 12 }}>{l.name}</span>
              <br />
              <span style={{ color: "#9E9B90", fontSize: 12 }}>{l.phone}</span>
              <br />
              <span style={{ color: "#9E9B90", fontSize: 12 }}>{l.hours}</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
