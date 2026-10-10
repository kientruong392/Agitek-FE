"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getAllBrands } from "@/actions/brand.action";
import BrandDataTable from "@/app/(admin)/admin/brands/components/brand-table";
import AddBrandDialog from "@/app/(admin)/admin/brands/components/add-brand-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminBrandsPage() {
  const t = useTranslations("AdminBrands");

  const { data: brands, isLoading, refetch } = useQuery({
    queryKey: ["admin", "brands"],
    queryFn: async () => {
      const res = await getAllBrands();
      return res.success ? (res.data ?? []) : [];
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <AddBrandDialog onCreated={() => void refetch()} />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ) : (
        <BrandDataTable data={brands ?? []} onDeleted={() => void refetch()} onUpdated={() => void refetch()} />
      )}
    </div>
  );
}
