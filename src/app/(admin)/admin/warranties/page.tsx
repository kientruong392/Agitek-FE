"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { getManagementWarranties } from "@/actions/warranty.action";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import WarrantyTable from "./components/warranty-table";

export default function AdminWarrantiesPage() {
  const t = useTranslations("WarrantyAdmin");
  const { data, error, isError, isLoading, refetch } = useQuery({
    queryKey: ["admin", "warranties"],
    queryFn: async () => {
      const response = await getManagementWarranties();
      if (!response.success) throw new Error(response.message || t("loadError"));
      return response.data ?? [];
    },
  });

  return (
    <section className="flex flex-col gap-6">
      <header><h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1><p className="text-sm text-muted-foreground">{t("description")}</p></header>
      {isLoading ? <Skeleton className="h-[420px] w-full rounded-xl" /> : isError ? <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-card p-8 text-center"><p className="text-sm text-destructive">{error instanceof Error ? error.message : t("loadError")}</p><Button variant="outline" onClick={() => void refetch()}>{t("retry")}</Button></div> : <WarrantyTable warranties={data ?? []} onUpdated={() => void refetch()} />}
    </section>
  );
}
