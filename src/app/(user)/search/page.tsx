import Link from "next/link";
import { AlertCircle, Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { semanticSearchProducts } from "@/actions/product.action";
import ProductCard from "@/app/(user)/components/ProductCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const [{ q }, t] = await Promise.all([searchParams, getTranslations("Search")]);
  const query = (Array.isArray(q) ? q[0] ?? "" : q ?? "").trim().slice(0, 500);
  const hasQuery = query.length >= 2;
  const response = hasQuery ? await semanticSearchProducts(query, 24) : null;
  const products = response?.success ? response.data ?? [] : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      <Breadcrumb className="mb-5">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink render={<Link href="/" />}>{t("home")}</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{t("title")}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t("title")}</h1>
        {hasQuery && <p className="mt-2 break-words text-sm text-muted-foreground">{t("query", { query })}</p>}
      </header>

      {!hasQuery ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {t("enterQuery")}
        </div>
      ) : response && !response.success ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{t("errorTitle")}</AlertTitle>
          <AlertDescription>{t("errorDescription")}</AlertDescription>
        </Alert>
      ) : products.length ? (
        <section aria-label={t("title")}>
          <p className="mb-5 text-sm text-muted-foreground">{t("resultsCount", { count: products.length })}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      ) : (
        <div className="flex flex-col items-center rounded-2xl border border-dashed px-4 py-12 text-center">
          <Search className="mb-4 size-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t("emptyTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("emptyDescription")}</p>
          <Button nativeButton={false} render={<Link href="/" />} variant="outline" className="mt-5">
            {t("backHome")}
          </Button>
        </div>
      )}
    </div>
  );
}
