"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getAllWarehouses } from "@/actions/location.action";
import LocationDataTable from "./components/location-table";
import LocationFormDialog from "./components/location-form-dialog";
import AllWarehousesDialog from "./components/all-warehouses-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLocationsPage() {
  const t = useTranslations("AdminLocations");

  const { data: warehouses, isLoading, refetch } = useQuery({
    queryKey: ["admin", "warehouses"],
    queryFn: async () => {
      const res = await getAllWarehouses();
      return res.success ? (res.data ?? []) : [];
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex items-center gap-3">
          <AllWarehousesDialog warehouses={warehouses ?? []} />
          <LocationFormDialog mode="create" onSuccess={() => void refetch()} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[260px] rounded-xl" />
          </div>
          <Skeleton className="h-[420px] w-full rounded-xl" />
        </div>
      ) : (
        <LocationDataTable data={warehouses ?? []} onUpdated={() => void refetch()} />
      )}
    </div>
  );
}
