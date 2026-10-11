"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getAllVouchers } from "@/actions/voucher.action";
import VoucherDataTable from "./components/voucher-table";
import AddVoucherDialog from "./components/add-voucher-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminVouchersPage() {
  const t = useTranslations("AdminVouchers");

  const { data: vouchers, isLoading, refetch } = useQuery({
    queryKey: ["admin", "vouchers"],
    queryFn: async () => {
      const res = await getAllVouchers();
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
        <div className="flex items-center gap-4">
          <AddVoucherDialog onCreated={() => void refetch()} />
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
        <VoucherDataTable data={vouchers ?? []} onUpdated={() => void refetch()} />
      )}
    </div>
  );
}
