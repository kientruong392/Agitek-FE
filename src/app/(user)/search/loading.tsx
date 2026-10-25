import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/skeleton";

export default async function SearchLoading() {
  const t = await getTranslations("Search");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10" aria-busy="true">
      <p className="sr-only" role="status">{t("loading")}</p>
      <Skeleton className="mb-5 h-5 w-48" />
      <Skeleton className="mb-2 h-10 w-64" />
      <Skeleton className="mb-6 h-5 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-2xl border p-3">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
