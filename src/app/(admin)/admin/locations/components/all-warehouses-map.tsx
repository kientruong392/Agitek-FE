"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LocationDTO } from "@/types/model.types";
import { LocationStatus, LocationStatusLabels } from "@/types/model.types";
import { VIETNAM_BOUNDS } from "./vietnam-bounds";

interface AllWarehousesMapProps {
  warehouses: LocationDTO[];
  className?: string;
  selectedLocationId?: number | null;
  onSelectWarehouse?: (id: number) => void;
}

const createWarehouseMarkerIcon = (code: string, isSelected: boolean) => {
  const primaryColor = isSelected ? "#e11d48" : "#2563eb";
  const shadowColor = isSelected ? "rgba(225,29,72,0.4)" : "rgba(37,99,235,0.35)";

  return L.divIcon({
    className: "warehouse-marker-icon",
    iconSize: [42, 52],
    iconAnchor: [21, 50],
    popupAnchor: [0, -44],
    tooltipAnchor: [0, -44],
    html: `
      <div style="position: relative; width: 42px; height: 52px; display: flex; flex-direction: column; align-items: center; justify-content: center; filter: drop-shadow(0 6px 12px ${shadowColor}); cursor: pointer;">
        <svg viewBox="0 0 24 30" width="42" height="52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 10.5 28.5 11.25 29.5C11.625 30 12.375 30 12.75 29.5C13.5 28.5 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="${primaryColor}"/>
          <circle cx="12" cy="11" r="7.5" fill="white"/>
        </svg>
        <div style="position: absolute; top: 5px; left: 0; right: 0; display: flex; align-items: center; justify-content: center;">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="${primaryColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div style="position: absolute; bottom: -8px; background: #0f172a; color: #ffffff; font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.25); white-space: nowrap; font-family: monospace;">
          ${code}
        </div>
      </div>
    `,
  });
};

function getStatusText(status: LocationStatus | null | undefined): { text: string; color: string } {
  switch (status) {
    case LocationStatus.Active:
      return { text: LocationStatusLabels[LocationStatus.Active], color: "#059669" };
    case LocationStatus.Inactive:
      return { text: LocationStatusLabels[LocationStatus.Inactive], color: "#dc2626" };
    case LocationStatus.Maintenance:
      return { text: LocationStatusLabels[LocationStatus.Maintenance], color: "#d97706" };
    default:
      return { text: "Kho hàng", color: "#2563eb" };
  }
}

export default function AllWarehousesMap({
  warehouses,
  className = "h-[500px] w-full rounded-2xl overflow-hidden border",
  selectedLocationId = null,
  onSelectWarehouse,
}: AllWarehousesMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);
  const markerMapRef = useRef<Map<number, L.Marker>>(new Map());

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on Vietnam
    const map = L.map(mapContainerRef.current, {
      center: [16.054407, 108.202167],
      zoom: 6,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    const markersGroup = L.featureGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    const invalidate = () => {
      try {
        map.invalidateSize();
      } catch {}
    };

    const timers = [
      setTimeout(invalidate, 50),
      setTimeout(invalidate, 150),
      setTimeout(invalidate, 300),
      setTimeout(invalidate, 600),
      setTimeout(invalidate, 1000),
    ];

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && mapContainerRef.current) {
      ro = new ResizeObserver(() => {
        invalidate();
      });
      ro.observe(mapContainerRef.current);
    }

    return () => {
      timers.forEach(clearTimeout);
      if (ro) ro.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      markersGroupRef.current = null;
      markerMapRef.current.clear();
    };
  }, []);

  // Update markers whenever warehouses or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    markerMapRef.current.clear();

    const bounds = L.latLngBounds([]);

    warehouses.forEach((loc) => {
      if (isNaN(loc.latitude) || isNaN(loc.longitude)) return;
      if (loc.latitude === 0 && loc.longitude === 0) return;

      const isSelected = selectedLocationId === loc.id;
      const marker = L.marker([loc.latitude, loc.longitude], {
        icon: createWarehouseMarkerIcon(loc.locationCode, isSelected),
        interactive: true,
      });

      const statusInfo = getStatusText(loc.status);

      // Hover Tooltip showing detailed warehouse information
      marker.bindTooltip(
        `<div style="font-family: inherit; padding: 4px 6px; min-width: 170px; max-width: 280px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <span style="font-weight: 800; color: #2563eb; font-size: 12px; font-family: monospace; background: #eff6ff; padding: 2px 6px; border-radius: 4px; border: 1px solid #bfdbfe;">
              ${loc.locationCode}
            </span>
            <span style="font-size: 10px; color: ${statusInfo.color}; font-weight: 600;">${statusInfo.text}</span>
          </div>
          <div style="font-size: 12px; font-weight: 600; color: #0f172a; line-height: 1.35; margin-bottom: 4px;">
            ${loc.locationName}
          </div>
          <div style="font-size: 10px; color: #64748b; font-family: monospace;">
            Tọa độ: ${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}
          </div>
        </div>`,
        {
          direction: "top",
          offset: [0, -36],
          opacity: 0.98,
        }
      );

      marker.on("click", () => {
        onSelectWarehouse?.(loc.id);
      });

      marker.addTo(markersGroup);
      markerMapRef.current.set(loc.id, marker);
      bounds.extend([loc.latitude, loc.longitude]);
    });

    if (warehouses.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else {
      map.setView(VIETNAM_BOUNDS.defaultCenter, 6);
    }
  }, [warehouses, selectedLocationId, onSelectWarehouse]);

  // Fly to selected warehouse
  useEffect(() => {
    if (!selectedLocationId || !mapInstanceRef.current) return;
    const marker = markerMapRef.current.get(selectedLocationId);
    if (marker) {
      const latlng = marker.getLatLng();
      mapInstanceRef.current.flyTo(latlng, 15, { animate: true, duration: 0.8 });
      marker.openTooltip();
    }
  }, [selectedLocationId]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className={className} />
    </div>
  );
}
