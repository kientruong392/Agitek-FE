"use client";

import { useQuery } from "@tanstack/react-query";
import { getManagementRefunds } from "@/actions/refund.action";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import RefundTable from "./components/refund-table";

export default function AdminRefundsPage() {
  const { data, error, isError, isLoading, refetch } = useQuery({
    queryKey: ["admin", "refunds"],
    queryFn: async () => {
      const response = await getManagementRefunds();
      if (!response.success) throw new Error(response.message || "Không thể tải danh sách yêu cầu hoàn tiền");
      return response.data ?? [];
    },
  });

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý hoàn tiền</h1>
        <p className="text-sm text-muted-foreground">Xem, đánh giá và phản hồi các yêu cầu trả hàng/hoàn tiền từ khách hàng.</p>
      </header>
      {isLoading ? <Skeleton className="h-[420px] w-full rounded-xl" /> : isError ? <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-card p-8 text-center"><p className="text-sm text-destructive">{error instanceof Error ? error.message : "Không thể tải danh sách yêu cầu hoàn tiền"}</p><Button variant="outline" onClick={() => void refetch()}>Thử lại</Button></div> : <RefundTable refunds={data ?? []} onUpdated={() => void refetch()} />}
    </section>
  );
}

