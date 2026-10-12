"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  Plus,
  Loader2,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { toast } from "@/components/ui/toast";
import { createLocation, updateLocation } from "@/actions/location.action";
import {
  isWithinVietnam,
  isValidLocationCode,
  VIETNAM_BOUNDS,
} from "./vietnam-bounds";
import { LocationStatus, LocationStatusLabels } from "@/types/model.types";
import type { LocationDTO } from "@/types/model.types";

const LocationMap = dynamic(() => import("./location-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full min-h-[380px] rounded-2xl bg-muted/40 border border-dashed animate-pulse flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <span>Đang tải bản đồ OpenStreetMap...</span>
    </div>
  ),
});

interface SearchLocationResult {
  place_id: number | string;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
}

interface LocationFormDialogProps {
  initialData?: LocationDTO | null;
  mode?: "create" | "edit";
  onSuccess: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export default function LocationFormDialog({
  initialData = null,
  mode = "create",
  onSuccess,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: LocationFormDialogProps) {
  const t = useTranslations("AdminLocations");

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (controlledOnOpenChange ?? (() => {}))
    : setInternalOpen;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [locationCode, setLocationCode] = useState(
    initialData?.locationCode ?? ""
  );
  const [locationName, setLocationName] = useState(
    initialData?.locationName ?? ""
  );
  const [latitude, setLatitude] = useState<number>(
    initialData?.latitude ?? VIETNAM_BOUNDS.defaultCenter[0]
  );
  const [longitude, setLongitude] = useState<number>(
    initialData?.longitude ?? VIETNAM_BOUNDS.defaultCenter[1]
  );
  const [status, setStatus] = useState<LocationStatus | null>(
    initialData?.status ?? LocationStatus.Active
  );

  // Search & Combobox State
  const [searchQuery, setSearchQuery] = useState(
    initialData?.locationName ?? ""
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchLocationResult[]>([]);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  // Sync initialData when opening or changing
  useEffect(() => {
    if (open) {
      setLocationCode(initialData?.locationCode ?? "");
      const initName = initialData?.locationName ?? "";
      setLocationName(initName);
      setSearchQuery(initName);
      setLatitude(initialData?.latitude ?? VIETNAM_BOUNDS.defaultCenter[0]);
      setLongitude(initialData?.longitude ?? VIETNAM_BOUNDS.defaultCenter[1]);
      setStatus(initialData?.status ?? LocationStatus.Active);
      setErrorMessage(null);
      setSearchResults([]);
      setComboboxOpen(false);
    }
  }, [open, initialData]);

  // Geocoding search using Photon OSM (fast, unblocked in VN) with Nominatim fallback
  const handleSearchOSM = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const cleanPrefix = trimmed.replace(/^[Kk]ho\s+/i, "").trim();
      const queriesToTry = [trimmed];
      if (cleanPrefix && cleanPrefix !== trimmed && cleanPrefix.length >= 2) {
        queriesToTry.push(cleanPrefix);
      }

      const allResults: SearchLocationResult[] = [];

      // 1. Primary: Photon OSM API (Komoot OpenStreetMap engine)
      for (const q of queriesToTry) {
        try {
          const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
            q
          )}&limit=8&lat=16.0544&lon=108.2022&lang=vi`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const features = data.features || [];
            for (const f of features) {
              const coords = f.geometry?.coordinates;
              if (!coords || coords.length < 2) continue;
              const lon = Number(coords[0]);
              const lat = Number(coords[1]);
              if (!isWithinVietnam(lat, lon)) continue;

              const p = f.properties || {};
              const parts = [
                p.name,
                p.housenumber
                  ? `${p.housenumber} ${p.street || ""}`.trim()
                  : p.street,
                p.locality,
                p.district,
                p.city || p.state,
                p.country || "Việt Nam",
              ].filter(
                (val, idx, arr): val is string =>
                  Boolean(val) && arr.indexOf(val) === idx
              );

              const displayName =
                parts.length > 0 ? parts.join(", ") : p.name || q;
              if (!allResults.some((r) => r.display_name === displayName)) {
                allResults.push({
                  place_id: p.osm_id || `${lat}_${lon}_${allResults.length}`,
                  display_name: displayName,
                  lat: String(lat),
                  lon: String(lon),
                  type: p.type || p.osm_value,
                });
              }
            }
          }
        } catch {
          // Fall through to Nominatim
        }
        if (allResults.length >= 5) break;
      }

      // 2. Fallback: Nominatim OpenStreetMap API
      if (allResults.length === 0) {
        for (const q of queriesToTry) {
          try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              q
            )}&countrycodes=vn&addressdetails=1&limit=8`;
            const res = await fetch(url, {
              headers: { "Accept-Language": "vi,en" },
            });
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) {
                for (const item of data) {
                  const lat = parseFloat(item.lat);
                  const lon = parseFloat(item.lon);
                  if (isWithinVietnam(lat, lon)) {
                    allResults.push({
                      place_id: item.place_id,
                      display_name: item.display_name,
                      lat: item.lat,
                      lon: item.lon,
                      type: item.type,
                    });
                  }
                }
              }
            }
          } catch {
            // Ignore fallback errors
          }
          if (allResults.length > 0) break;
        }
      }

      setSearchResults(allResults);
      if (allResults.length > 0) {
        setComboboxOpen(true);
      }
    } catch {
      // Silently ignore network errors in combobox
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search query
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      if (searchQuery && searchQuery.trim().length >= 2) {
        void handleSearchOSM(searchQuery);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, open, handleSearchOSM]);

  // Reverse Geocoding when Marker is moved on map (Photon OSM with Nominatim fallback)
  const handleReverseGeocode = async (lat: number, lng: number) => {
    if (!isWithinVietnam(lat, lng)) {
      setErrorMessage(t("vietnamOnlyError"));
      return;
    }
    setErrorMessage(null);

    // 1. Try Photon reverse geocoding
    try {
      const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const p = data.features?.[0]?.properties;
        if (p) {
          const parts = [
            p.name,
            p.housenumber
              ? `${p.housenumber} ${p.street || ""}`.trim()
              : p.street,
            p.locality,
            p.district,
            p.city || p.state,
            p.country || "Việt Nam",
          ].filter(
            (val, idx, arr): val is string =>
              Boolean(val) && arr.indexOf(val) === idx
          );
          if (parts.length > 0) {
            const formatted = parts.join(", ");
            setLocationName(formatted);
            setSearchQuery(formatted);
            return;
          }
        }
      }
    } catch {
      // Fall through to Nominatim
    }

    // 2. Fallback to Nominatim reverse geocoding
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "vi,en" },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.display_name) {
        setLocationName(data.display_name);
        setSearchQuery(data.display_name);
      }
    } catch {
      // Ignore network hiccup on drag
    }
  };

  const handlePositionChange = (newLat: number, newLng: number) => {
    setLatitude(newLat);
    setLongitude(newLng);
    if (!isWithinVietnam(newLat, newLng)) {
      setErrorMessage(t("vietnamOnlyError"));
    } else {
      setErrorMessage(null);
      void handleReverseGeocode(newLat, newLng);
    }
  };

  const handleSelectSuggestion = (item: SearchLocationResult) => {
    setLocationName(item.display_name);
    setSearchQuery(item.display_name);
    setComboboxOpen(false);
    const newLat = Number(parseFloat(item.lat).toFixed(6));
    const newLng = Number(parseFloat(item.lon).toFixed(6));
    setLatitude(newLat);
    setLongitude(newLng);

    if (!isWithinVietnam(newLat, newLng)) {
      setErrorMessage(t("vietnamOnlyError"));
    } else {
      setErrorMessage(null);
    }
  };

  const handleManualSearch = async () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setComboboxOpen(true);
    await handleSearchOSM(trimmed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = locationCode.trim().toUpperCase();
    if (!isValidLocationCode(cleanCode)) {
      const msg = t("invalidCodeError");
      setErrorMessage(msg);
      toast.add({ title: msg, type: "error" });
      return;
    }

    if (!locationName.trim()) {
      const msg = t("nameRequired");
      setErrorMessage(msg);
      toast.add({ title: msg, type: "error" });
      return;
    }

    if (!isWithinVietnam(latitude, longitude)) {
      const msg = t("vietnamOnlyError");
      setErrorMessage(msg);
      toast.add({ title: msg, type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        locationCode: cleanCode,
        locationName: locationName.trim(),
        latitude,
        longitude,
        isWarehouse: true,
        status: status !== null ? Number(status) : null,
      };

      if (mode === "create") {
        const res = await createLocation(payload);
        if (res.success) {
          toast.add({ title: t("createSuccess"), type: "success" });
          setOpen(false);
          onSuccess();
        } else {
          setErrorMessage(res.message || t("INTERNAL_SERVER_ERROR"));
          toast.add({
            title: res.message || t("INTERNAL_SERVER_ERROR"),
            type: "error",
          });
        }
      } else if (initialData?.id) {
        const res = await updateLocation(initialData.id, payload);
        if (res.success) {
          toast.add({ title: t("updateSuccess"), type: "success" });
          setOpen(false);
          onSuccess();
        } else {
          setErrorMessage(res.message || t("INTERNAL_SERVER_ERROR"));
          toast.add({
            title: res.message || t("INTERNAL_SERVER_ERROR"),
            type: "error",
          });
        }
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : t("INTERNAL_SERVER_ERROR");
      setErrorMessage(msg);
      toast.add({ title: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {!isControlled &&
        (trigger ? (
          <div onClick={() => setOpen(true)}>{trigger}</div>
        ) : mode === "create" ? (
          <Button size="sm" onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>{t("addLocation")}</span>
          </Button>
        ) : null)}

      <Dialog
        open={open}
        onOpenChange={(val) => {
          if (!isSubmitting) setOpen(val);
        }}
      >
        <DialogContent className="sm:max-w-5xl xl:max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <MapPin className="h-5 w-5 text-primary" />
              <span>
                {mode === "create"
                  ? t("addLocationTitle")
                  : t("editLocationTitle")}
              </span>
            </DialogTitle>
          </DialogHeader>

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-sm rounded-xl bg-destructive/10 text-destructive border border-destructive/20 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Horizontal 2-Column Layout: Left Form Fields, Right Map */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: Inputs and controls */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {/* Row 1: Location Code + Status */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Location Code: Empty placeholder as requested */}
                  <div className="space-y-1.5">
                    <Label htmlFor="locationCode" className="text-sm font-semibold">
                      {t("locationCode")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="locationCode"
                      value={locationCode}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        if (val.length <= 4) setLocationCode(val);
                      }}
                      placeholder=""
                      className="font-mono tracking-widest uppercase font-bold"
                      required
                      maxLength={4}
                    />
                  </div>

                  {/* Status: Select dropdown for update */}
                  <div className="space-y-1.5">
                    <Label htmlFor="locationStatus" className="text-sm font-semibold">
                      Trạng thái
                    </Label>
                    <Select
                      value={
                        status !== null && status !== undefined
                          ? String(status)
                          : String(LocationStatus.Active)
                      }
                      onValueChange={(val) =>
                        setStatus(
                          val !== null
                            ? (Number(val) as LocationStatus)
                            : LocationStatus.Active
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn trạng thái">
                          {(val) => {
                            if (val === null || val === undefined || val === "")
                              return "Chọn trạng thái";
                            const num = Number(val);
                            return (
                              LocationStatusLabels[num as LocationStatus] ??
                              "Chọn trạng thái"
                            );
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LocationStatusLabels).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2: Location Name with Shadcn Base UI Combobox + Search Button */}
                <div className="space-y-1.5">
                  <Label htmlFor="locationName" className="text-sm font-semibold">
                    {t("locationName")} <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <Combobox
                        value={locationName}
                        open={comboboxOpen}
                        onOpenChange={setComboboxOpen}
                        onValueChange={(val) => {
                          if (val) {
                            const found = searchResults.find(
                              (r) => r.display_name === val
                            );
                            if (found) {
                              handleSelectSuggestion(found);
                            } else {
                              setLocationName(val);
                              setSearchQuery(val);
                              setComboboxOpen(false);
                            }
                          }
                        }}
                        inputValue={searchQuery}
                        onInputValueChange={(text) => {
                          setSearchQuery(text);
                          if (!text.trim()) {
                            setSearchResults([]);
                          }
                        }}
                        filter={null}
                      >
                        <ComboboxInput
                          placeholder="Nhập địa chỉ tại Việt Nam để tìm kiếm..."
                          showTrigger
                          showClear
                          className="w-full bg-background"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void handleManualSearch();
                            }
                          }}
                        />
                        <ComboboxContent className="max-h-72 p-1 rounded-2xl shadow-xl z-50 bg-popover text-popover-foreground">
                          <ComboboxList>
                            <ComboboxEmpty className="p-3 text-xs text-center text-muted-foreground">
                              {searchQuery.trim().length < 2
                                ? "Nhập ít nhất 2 ký tự hoặc bấm Tìm kiếm"
                                : isSearching
                                ? "Đang tìm kiếm..."
                                : "Không tìm thấy địa chỉ phù hợp"}
                            </ComboboxEmpty>

                            {/* Custom text selection option */}
                            {searchQuery.trim().length >= 2 &&
                              !searchResults.some(
                                (r) => r.display_name === searchQuery.trim()
                              ) && (
                                <ComboboxItem
                                  value={searchQuery.trim()}
                                  className="flex items-center gap-2 p-2.5 cursor-pointer rounded-xl text-xs text-primary font-medium border-b border-border/50 hover:bg-primary/10"
                                >
                                  <Navigation className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">
                                    Sử dụng: &quot;{searchQuery.trim()}&quot;
                                  </span>
                                </ComboboxItem>
                              )}

                            {/* Search results */}
                            {searchResults.map((item) => (
                              <ComboboxItem
                                key={String(item.place_id)}
                                value={item.display_name}
                                className="flex items-start gap-2.5 p-2.5 cursor-pointer rounded-xl text-xs leading-snug hover:bg-muted"
                              >
                                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <span className="line-clamp-2">
                                  {item.display_name}
                                </span>
                              </ComboboxItem>
                            ))}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void handleManualSearch()}
                      disabled={isSearching || !searchQuery.trim()}
                      className="h-9 shrink-0 gap-1.5 px-3.5 rounded-2xl border border-input/60 hover:bg-accent font-medium shadow-none"
                    >
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <Search className="h-4 w-4 text-primary" />
                      )}
                      <span>Tìm kiếm</span>
                    </Button>
                  </div>
                </div>

                {/* Selected Address Card */}
                {locationName && (
                  <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-muted/40 border text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold uppercase tracking-wider text-[10px]">
                        Địa chỉ đã chọn
                      </span>
                      <span className="font-mono text-[11px]">
                        {latitude.toFixed(5)}, {longitude.toFixed(5)}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground font-medium leading-snug break-words">
                        {locationName}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Map placed completely to the right */}
              <div className="lg:col-span-7 flex flex-col gap-2 min-h-[380px] h-[380px] lg:h-[420px]">
                <Label className="text-sm font-semibold flex items-center justify-between">
                  <span>Bản đồ vị trí (OpenStreetMap)</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Click hoặc kéo ghim để đổi vị trí
                  </span>
                </Label>
                <div className="w-full h-full min-h-[380px] flex-1">
                  {open && (
                    <LocationMap
                      lat={latitude}
                      lng={longitude}
                      onPositionChange={handlePositionChange}
                      className="h-full w-full rounded-2xl overflow-hidden border shadow-inner"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Dialog Footer */}
            <DialogFooter className="pt-2 border-t flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isWithinVietnam(latitude, longitude)}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{mode === "create" ? t("create") : t("confirm")}</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
