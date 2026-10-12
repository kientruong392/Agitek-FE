"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  Warehouse,
  MapPin,
  Loader2,
  Search,
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { LocationDTO } from "@/types/model.types";
import { LocationStatus, LocationStatusLabels } from "@/types/model.types";

const AllWarehousesMap = dynamic(() => import("./all-warehouses-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-2xl bg-muted/40 border border-dashed animate-pulse flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <span>Đang tải bản đồ hệ thống kho hàng...</span>
    </div>
  ),
});

interface AllWarehousesDialogProps {
  warehouses: LocationDTO[];
}

function getStatusBadgeMini(status: LocationStatus | null | undefined) {
  switch (status) {
    case LocationStatus.Active:
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3" />
          {LocationStatusLabels[LocationStatus.Active]}
        </span>
      );
    case LocationStatus.Inactive:
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
          <XCircle className="h-3 w-3" />
          {LocationStatusLabels[LocationStatus.Inactive]}
        </span>
      );
    case LocationStatus.Maintenance:
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
          <AlertTriangle className="h-3 w-3" />
          {LocationStatusLabels[LocationStatus.Maintenance]}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border">
          Chưa xác định
        </span>
      );
  }
}

export default function AllWarehousesDialog({
  warehouses,
}: AllWarehousesDialogProps) {
  const t = useTranslations("AdminLocations");
  const [open, setOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(
    null
  );
  const [filterQuery, setFilterQuery] = useState("");

  const filteredWarehouses = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return warehouses;
    return warehouses.filter(
      (wh) =>
        wh.locationCode.toLowerCase().includes(q) ||
        wh.locationName.toLowerCase().includes(q)
    );
  }, [warehouses, filterQuery]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setOpen(true);
          setSelectedWarehouseId(null);
          setFilterQuery("");
        }}
        className="gap-2 border-primary/30 hover:bg-primary/5 text-foreground font-medium"
      >
        <Warehouse className="h-4 w-4 text-primary" />
        <span>{t("viewAllWarehouses")}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-5xl xl:max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <Warehouse className="h-5 w-5 text-primary" />
                  <span>{t("allWarehousesMapTitle")}</span>
                  <Badge variant="secondary" className="font-mono text-xs ml-1">
                    {warehouses.length} kho
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {t("allWarehousesMapDesc")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* 2-Column Horizontal Rectangular Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start py-1">
            {/* LEFT COLUMN: Warehouse List & Filter */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              {/* Search filter */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Tìm theo mã kho hoặc tên địa điểm..."
                  className="pl-9 h-9 text-xs"
                />
              </div>

              {/* Scrollable list */}
              <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
                {filteredWarehouses.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-dashed">
                    Không tìm thấy kho hàng phù hợp
                  </div>
                ) : (
                  filteredWarehouses.map((wh) => {
                    const isSelected = selectedWarehouseId === wh.id;
                    return (
                      <div
                        key={wh.id}
                        onClick={() => setSelectedWarehouseId(wh.id)}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? "bg-primary/10 border-primary shadow-sm ring-1 ring-primary/20"
                            : "bg-card hover:bg-muted/50 border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                            {wh.locationCode}
                          </span>
                          {getStatusBadgeMini(wh.status)}
                        </div>
                        <div className="flex items-start gap-1.5 text-foreground leading-snug">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <span className="line-clamp-2 font-medium">
                            {wh.locationName}
                          </span>
                        </div>
                        <div className="mt-2 text-[10px] text-muted-foreground font-mono">
                          {wh.latitude.toFixed(5)}, {wh.longitude.toFixed(5)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Full Map on the right */}
            <div className="lg:col-span-7 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span className="font-semibold text-foreground">
                  Bản đồ toàn quốc (OpenStreetMap)
                </span>
                <span>Click vào ghim kho để xem chi tiết</span>
              </div>
              <div className="h-[460px] lg:h-[500px] w-full">
                <AllWarehousesMap
                  warehouses={filteredWarehouses}
                  selectedLocationId={selectedWarehouseId}
                  onSelectWarehouse={(id) => setSelectedWarehouseId(id)}
                  className="h-full w-full rounded-2xl overflow-hidden border shadow-inner"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
