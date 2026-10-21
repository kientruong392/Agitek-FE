"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import type { LocationDTO, OrderTrackingLog } from "@/types/model.types";

type Point = {
  lat: number;
  lng: number;
  code: string | null;
  label: string;
  isDestination: boolean;
};

function createRouteMarkerIcon(step: number, isDestination: boolean, code: string | null) {
  const color = isDestination ? "#16a34a" : "#2563eb";
  const shadowColor = isDestination ? "rgba(22,163,74,0.35)" : "rgba(37,99,235,0.35)";
  const markerLabel = isDestination ? "GIAO" : code || `KHO ${step}`;
  const symbol = isDestination
    ? `<path d="M6 12.5 10 16.5 18 8.5" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 22v-8h6v8" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;

  return L.divIcon({
    className: "order-route-marker-icon",
    iconSize: [42, 52],
    iconAnchor: [21, 50],
    popupAnchor: [0, -44],
    tooltipAnchor: [0, -44],
    html: `
      <div style="position:relative;width:42px;height:52px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 6px 12px ${shadowColor});">
        <svg viewBox="0 0 24 30" width="42" height="52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 10.5 28.5 11.25 29.5C11.625 30 12.375 30 12.75 29.5C13.5 28.5 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="${color}"/>
          <circle cx="12" cy="11" r="7.5" fill="white"/>
          ${symbol}
        </svg>
        <span style="position:absolute;right:-7px;top:-5px;display:grid;place-items:center;min-width:18px;height:18px;padding:0 4px;border-radius:999px;background:#0f172a;border:2px solid white;color:white;font:700 10px/1 system-ui,sans-serif;">${step}</span>
        <span style="position:absolute;bottom:-8px;background:#0f172a;border:1px solid rgba(255,255,255,0.25);border-radius:4px;color:#fff;font:700 10px/1 ui-monospace,SFMono-Regular,monospace;padding:1px 5px;white-space:nowrap;">${markerLabel}</span>
      </div>
    `,
  });
}

function isValidCoordinate(latitude: number | null | undefined, longitude: number | null | undefined) {
  return typeof latitude === "number" && typeof longitude === "number" &&
    Number.isFinite(latitude) && Number.isFinite(longitude);
}

function getChronologicalPoints(logs: OrderTrackingLog[], destination?: LocationDTO | null): Point[] {
  const points = logs
    .filter((log) => isValidCoordinate(log.latitude, log.longitude))
    .slice()
    .sort((left, right) => {
      const timeDifference = new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();
      return timeDifference || left.id - right.id;
    })
    .map((log) => ({
      lat: log.latitude as number,
      lng: log.longitude as number,
      code: log.locationCode || null,
      label: log.locationName || log.description || "Kho trung chuyển",
      isDestination: false,
    }));

  if (destination && isValidCoordinate(destination.latitude, destination.longitude)) {
    points.push({
      lat: destination.latitude,
      lng: destination.longitude,
      code: null,
      label: destination.locationName || "Điểm giao hàng",
      isDestination: true,
    });
  }

  return points;
}

export default function RouteMap({ logs, destination }: { logs: OrderTrackingLog[]; destination?: LocationDTO | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.FeatureGroup | null>(null);
  const routeLayersRef = useRef<L.Routing.Control[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: true }).setView([16.054407, 108.202167], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapRef.current = map;
    markersLayerRef.current = L.featureGroup().addTo(map);

    const invalidate = () => map.invalidateSize();
    const timers = [50, 150, 300, 600].map((delay) => setTimeout(invalidate, delay));
    const resizeObserver = new ResizeObserver(invalidate);
    resizeObserver.observe(containerRef.current);

    return () => {
      routeLayersRef.current.forEach((route) => map.removeControl(route));
      routeLayersRef.current = [];
      resizeObserver.disconnect();
      timers.forEach(clearTimeout);
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    const points = getChronologicalPoints(logs, destination);
    routeLayersRef.current.forEach((route) => map.removeControl(route));
    routeLayersRef.current = [];
    markersLayer.clearLayers();

    points.forEach((point, index) => {
      L.marker([point.lat, point.lng], {
        icon: createRouteMarkerIcon(index + 1, point.isDestination, point.code),
        interactive: true,
      })
        .bindTooltip(`${index + 1}. ${point.code ? `[${point.code}] ` : ""}${point.label}`, { direction: "top", offset: [0, -36] })
        .addTo(markersLayer);
    });

    // One routing control per chronological leg prevents paths from branching
    // or skipping a warehouse when several tracking points are present.
    for (let index = 0; index < points.length - 1; index++) {
      const from = points[index];
      const to = points[index + 1];
      if (from.lat === to.lat && from.lng === to.lng) continue;

      const waypoints = [L.latLng(from.lat, from.lng), L.latLng(to.lat, to.lng)];
      const route = L.Routing.control({
        waypoints,
        addWaypoints: false,
        routeWhileDragging: false,
        show: false,
        fitSelectedRoutes: false,
        plan: L.Routing.plan(waypoints, { createMarker: () => false }),
        lineOptions: {
          styles: [{ color: "#2563eb", weight: 5, opacity: 0.8 }],
          extendToWaypoints: true,
          missingRouteTolerance: 0,
        },
      }).addTo(map);
      routeLayersRef.current.push(route);
    }

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13);
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng] as L.LatLngExpression));
      if (bounds.isValid()) map.fitBounds(bounds.pad(0.15));
    }

    requestAnimationFrame(() => map.invalidateSize());
  }, [logs, destination]);

  return <div ref={containerRef} className="h-80 w-full rounded-xl border [&_.leaflet-tile]:max-w-none!" />;
}
