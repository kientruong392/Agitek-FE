"use client";

import { useQuery } from "@tanstack/react-query";
import { getManagementOrders } from "@/actions/order.action";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import OrderManagementTable from "./components/order-management-table";

export default function AdminOrdersPage() {
  const { data, error, isError, isLoading, refetch } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const response = await getManagementOrders();
      if (!response.success) throw new Error(response.message || "Không thể tải danh sách đơn hàng");
      return response.data ?? [];
    },
  });

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý đơn hàng</h1>
        <p className="text-sm text-muted-foreground">Theo dõi đơn hàng, phân công giao hàng và cập nhật tuyến vận chuyển.</p>
      </header>
      {isLoading ? <Skeleton className="h-[420px] w-full rounded-xl" /> : isError ? <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-card p-8 text-center"><p className="text-sm text-destructive">{error instanceof Error ? error.message : "Không thể tải danh sách đơn hàng"}</p><Button variant="outline" onClick={() => void refetch()}>Thử lại</Button></div> : <OrderManagementTable orders={data ?? []} onUpdated={() => void refetch()} />}
    </section>
  );
}
