"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getAllCategoriesWithSub } from "@/actions/category.action";
import CategoryDataTable from "@/app/(admin)/admin/categories/components/category-table";
import AddCategoryDialog from "@/app/(admin)/admin/categories/components/add-category-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCategoriesPage() {
  const t = useTranslations("AdminCategories");

  const { data: categories, isLoading, refetch } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const res = await getAllCategoriesWithSub();
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
        <AddCategoryDialog onCreated={() => void refetch()} />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ) : (
        <CategoryDataTable data={categories ?? []} onDeleted={() => void refetch()} onUpdated={() => void refetch()} />
      )}
    </div>
  );
}
