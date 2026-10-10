"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getAllStaff } from "@/actions/user.action";
import StaffDataTable from "./components/staff-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminStaffPage() {
  const t = useTranslations("AdminUsers");

  const { data: staff, isLoading, refetch } = useQuery({
    queryKey: ["admin", "staff"],
    queryFn: async () => {
      const res = await getAllStaff();
      return res.success ? (res.data ?? []) : [];
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("staffTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("staffDescription")}</p>
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
        <StaffDataTable data={staff ?? []} onUpdated={() => void refetch()} />
      )}
    </div>
  );
}
