"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { isWithinVietnam } from "./vietnam-bounds";
import { cn } from "cn";

interface LocationMapProps {
  lat: number;
  lng: number;
  onPositionChange: (lat: number, lng: number) => void;
  className?: string;
  zoom?: number;
}

const createMarkerIcon = (isValid: boolean) => {
  const color = isValid ? "#2563eb" : "#ef4444";
  const shadowColor = isValid ? "rgba(37,99,235,0.4)" : "rgba(239,68,68,0.4)";

  return L.divIcon({
    className: "custom-leaflet-marker",
    iconSize: [36, 46],
    iconAnchor: [18, 44],
    popupAnchor: [0, -40],
    html: `
      <div style="position: relative; width: 36px; height: 46px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 6px 12px ${shadowColor}); cursor: grab;">
        <svg viewBox="0 0 24 30" width="36" height="46" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 10.5 28.5 11.25 29.5C11.625 30 12.375 30 12.75 29.5C13.5 28.5 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="${color}"/>
          <circle cx="12" cy="11" r="5" fill="white"/>
          <circle cx="12" cy="11" r="2.5" fill="${color}"/>
        </svg>
      </div>
    `,
  });
};

export default function LocationMap({
  lat,
  lng,
  onPositionChange,
  className = "h-[400px] w-full rounded-2xl overflow-hidden border",
  zoom = 13,
}: LocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const callbackRef = useRef(onPositionChange);
  callbackRef.current = onPositionChange;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = isNaN(lat) || lat === 0 ? 21.028511 : lat;
    const initialLng = isNaN(lng) || lng === 0 ? 105.854167 : lng;
    const isValid = isWithinVietnam(initialLat, initialLng);

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom,
      zoomControl: true,
      fadeAnimation: true,
    });

    // OpenStreetMap Tile Layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Draggable Marker
    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: createMarkerIcon(isValid),
    }).addTo(map);

    marker.on("dragend", (e: L.LeafletEvent) => {
      const target = e.target as L.Marker;
      const pos = target.getLatLng();
      const newLat = Number(pos.lat.toFixed(6));
      const newLng = Number(pos.lng.toFixed(6));
      callbackRef.current(newLat, newLng);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      const newLat = Number(clickLat.toFixed(6));
      const newLng = Number(clickLng.toFixed(6));
      marker.setLatLng([newLat, newLng]);
      callbackRef.current(newLat, newLng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Call invalidateSize repeatedly to handle modal transition / animation
    const timeouts = [
      setTimeout(() => map.invalidateSize(), 50),
      setTimeout(() => map.invalidateSize(), 150),
      setTimeout(() => map.invalidateSize(), 300),
      setTimeout(() => map.invalidateSize(), 600),
      setTimeout(() => map.invalidateSize(), 1000),
    ];

    // ResizeObserver ensures invalidateSize is called whenever container size changes
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      timeouts.forEach(clearTimeout);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []); // Run once on mount

  // Sync external position updates (from input or search suggestion)
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    if (isNaN(lat) || isNaN(lng)) return;

    const currentMarkerPos = markerRef.current.getLatLng();
    const latDiff = Math.abs(currentMarkerPos.lat - lat);
    const lngDiff = Math.abs(currentMarkerPos.lng - lng);

    const isValid = isWithinVietnam(lat, lng);
    markerRef.current.setIcon(createMarkerIcon(isValid));

    // Only update position if it genuinely changed (avoid loops)
    if (latDiff > 0.00001 || lngDiff > 0.00001) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.panTo([lat, lng], { animate: true });
    }
  }, [lat, lng]);

  return (
    <div className="relative w-full h-full min-h-[380px] flex flex-col">
      <div
        ref={mapContainerRef}
        className={cn("w-full h-full min-h-[380px] [&_.leaflet-tile]:!max-w-none", className)}
        style={{ minHeight: "380px", height: "100%", width: "100%" }}
      />
      <div className="absolute top-2 right-2 z-[400] bg-background/95 backdrop-blur-md px-3 py-1.5 rounded-xl border text-xs shadow-md flex items-center gap-2 pointer-events-none">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            isWithinVietnam(lat, lng) ? "bg-emerald-500 animate-pulse" : "bg-destructive animate-ping"
          }`}
        />
        <span className="font-semibold text-xs">
          {isWithinVietnam(lat, lng) ? "Việt Nam (Hợp lệ)" : "Ngoài phạm vi Việt Nam"}
        </span>
      </div>
    </div>
  );
}
