"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getAllCustomers } from "@/actions/user.action";
import CustomerDataTable from "./components/customer-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCustomersPage() {
  const t = useTranslations("AdminUsers");

  const { data: customers, isLoading, refetch } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      const res = await getAllCustomers();
      return res.success ? (res.data ?? []) : [];
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("customersTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("customersDescription")}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[250px] rounded-xl" />
            <Skeleton className="h-10 w-[180px] rounded-xl" />
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      ) : (
        <CustomerDataTable data={customers ?? []} onUpdated={() => void refetch()} />
      )}
    </div>
  );
}
