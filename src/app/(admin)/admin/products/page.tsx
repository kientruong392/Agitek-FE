"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getAllProducts } from "@/actions/product.action";
import ProductDataTable from "./components/product-table";
import AddProductDialog from "./components/add-product-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function AdminProductsPage() {
  const t = useTranslations("AdminProducts");
  const [showDeleted, setShowDeleted] = useState(false);

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const res = await getAllProducts();
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
          <div className="flex items-center space-x-2 border rounded-md px-3 py-1.5 bg-card">
            <Switch id="show-deleted" checked={showDeleted} onCheckedChange={setShowDeleted} />
            <Label htmlFor="show-deleted" className="cursor-pointer">{t("showDeleted")}</Label>
          </div>
          <AddProductDialog onCreated={() => void refetch()} />
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
        <ProductDataTable data={products ?? []} onDeleted={() => void refetch()} onUpdated={() => void refetch()} showDeleted={showDeleted} />
      )}
    </div>
  );
}
