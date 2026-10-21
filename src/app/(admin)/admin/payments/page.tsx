"use client";

import { useQuery } from "@tanstack/react-query";
import { getManagementPayments } from "@/actions/payment.action";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PaymentTable from "./components/payment-table";

export default function AdminPaymentsPage() {
  const { data, error, isError, isLoading, refetch } = useQuery({
    queryKey: ["admin", "payments"],
    queryFn: async () => {
      const response = await getManagementPayments();
      if (!response.success) throw new Error(response.message || "Không thể tải danh sách giao dịch thanh toán");
      return response.data ?? [];
    },
  });

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý thanh toán</h1>
        <p className="text-sm text-muted-foreground">Theo dõi giao dịch thanh toán và thông tin đơn hàng liên quan.</p>
      </header>
      {isLoading ? <Skeleton className="h-[420px] w-full rounded-xl" /> : isError ? <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-card p-8 text-center"><p className="text-sm text-destructive">{error instanceof Error ? error.message : "Không thể tải danh sách giao dịch thanh toán"}</p><Button variant="outline" onClick={() => void refetch()}>Thử lại</Button></div> : <PaymentTable payments={data ?? []} />}
    </section>
  );
}

