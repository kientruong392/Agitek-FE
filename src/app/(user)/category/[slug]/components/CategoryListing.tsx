"use client";

import { Fragment, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import {
  Grid2X2,
  List,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import {
  columnFilteringFeature,
  coreFeatures,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import ProductCard from "@/app/(user)/components/ProductCard";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ProductStatus } from "@/types/model.types";
import type { Brand, Category, Product } from "@/types/model.types";

const features = tableFeatures({
  ...coreFeatures,
  columnFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

type Features = typeof features;
type ListingFilters = {
  brandIds: number[];
  minPrice: number | undefined;
  maxPrice: number | undefined;
  minRating: number | undefined;
  statuses: ProductStatus[];
  discountedOnly: boolean;
};

const DEFAULT_FILTERS: ListingFilters = {
  brandIds: [],
  minPrice: undefined,
  maxPrice: undefined,
  minRating: undefined,
  statuses: [],
  discountedOnly: false,
};

const columns: ColumnDef<Features, Product>[] = [
  { id: "brand", accessorFn: (product) => product.brandId },
  { id: "price", accessorFn: (product) => product.discountPrice ?? product.originalPrice },
  { id: "rating", accessorFn: (product) => product.averageRating ?? 0 },
  { id: "createdAt", accessorFn: (product) => new Date(product.createdAt).getTime() },
  { id: "productName", accessorFn: (product) => product.productName },
  {
    id: "listingFilters",
    accessorFn: (product) => product.id,
    enableSorting: false,
    filterFn: (row, _columnId, filterValue: ListingFilters) => {
      const product = row.original;
      const price = product.discountPrice ?? product.originalPrice;
      if (filterValue.brandIds.length && !filterValue.brandIds.includes(product.brandId)) return false;
      if (filterValue.minPrice != null && price < filterValue.minPrice) return false;
      if (filterValue.maxPrice != null && price > filterValue.maxPrice) return false;
      if (filterValue.minRating != null && (product.averageRating ?? 0) < filterValue.minRating) return false;
      if (filterValue.statuses.length && !filterValue.statuses.includes(product.status)) return false;
      if (filterValue.discountedOnly && (product.discountPrice == null || product.discountPrice >= product.originalPrice)) return false;
      return true;
    },
  },
];

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function statusVariant(status: ProductStatus) {
  switch (status) {
    case ProductStatus.InStock:
      return "default" as const;
    case ProductStatus.LowStock:
    case ProductStatus.PreOrder:
      return "secondary" as const;
    case ProductStatus.OutOfStock:
    case ProductStatus.Deleted:
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function ProductListItem({ product }: { product: Product }) {
  const t = useTranslations("Home");
  const image = product.images?.find((item) => item.isPrimary) ?? product.images?.[0];
  const isPreOrder = product.status === ProductStatus.PreOrder;
  const isOutOfStock = product.status === ProductStatus.OutOfStock || product.stockQuantity <= 0;
  const effectiveStatus = isPreOrder
    ? ProductStatus.PreOrder
    : isOutOfStock
      ? ProductStatus.OutOfStock
      : product.status;
  const statusLabel = {
    [ProductStatus.Pending]: t("pending"),
    [ProductStatus.InStock]: t("inStock"),
    [ProductStatus.LowStock]: t("lowStock"),
    [ProductStatus.OutOfStock]: t("outOfStock"),
    [ProductStatus.Hidden]: t("hidden"),
    [ProductStatus.PreOrder]: t("preOrder"),
    [ProductStatus.Deleted]: t("deleted"),
  }[effectiveStatus] ?? t("outOfStock");
  const price = product.discountPrice != null && product.discountPrice < product.originalPrice
    ? product.discountPrice
    : product.originalPrice;

  return (
    <Link href={`/product/${product.slug}`} aria-label={t("viewProduct", { product: product.productName })} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
      <article className="flex flex-col gap-3 rounded-2xl border bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
          <Image src={image?.imageUrl || "/images/no-image.png"} alt={image?.altText ?? product.productName} fill className="object-contain p-2" unoptimized />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 font-medium">{product.productName}</h2>
          {product.averageRating != null && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="size-3.5 fill-amber-400 text-amber-400" /> {product.averageRating.toFixed(1)}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(effectiveStatus)}>{statusLabel}</Badge>
            <span className="text-xs text-muted-foreground">{t("stockCount", { count: product.stockQuantity })}</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <strong className="text-primary">{formatPrice(price)}</strong>
        </div>
      </article>
    </Link>
  );
}

export default function CategoryListing({
  category,
  products,
  brands,
}: {
  category: Category;
  products: Product[];
  brands: Brand[];
}) {
  const t = useTranslations("CategoryListing");
  const [filters, setFilters] = useState<ListingFilters>(DEFAULT_FILTERS);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 12 });
  const [view, setView] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const maxProductPrice = useMemo(
    () => Math.max(0, ...products.map((product) => product.discountPrice ?? product.originalPrice)),
    [products],
  );
  const columnFilters = useMemo(() => [{ id: "listingFilters", value: filters }], [filters]);

  const table = useTable({
    features,
    data: products,
    columns,
    autoResetPageIndex: false,
    state: { sorting, pagination, columnFilters },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPagination((current) => ({ ...current, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
  });

  function updateFilters(updates: Partial<ListingFilters>) {
    setFilters((current) => ({ ...current, ...updates }));
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }

  function toggleBrand(brandId: number, checked: boolean) {
    updateFilters({
      brandIds: checked
        ? [...filters.brandIds, brandId]
        : filters.brandIds.filter((id) => id !== brandId),
    });
  }

  const totalProducts = table.getFilteredRowModel().rows.length;
  const pageCount = Math.max(1, table.getPageCount());
  const pageIndex = table.state.pagination.pageIndex;
  const pageSize = table.state.pagination.pageSize;
  const pageLinks = Array.from({ length: pageCount }, (_, index) => index).filter(
    (index) => index === 0 || index === pageCount - 1 || Math.abs(index - pageIndex) <= 1,
  );
  const firstResult = totalProducts ? pageIndex * pageSize + 1 : 0;
  const lastResult = Math.min((pageIndex + 1) * pageSize, totalProducts);

  const filtersPanel = (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-3 font-semibold">{t("brand")}</h2>
        <div className="flex max-h-52 flex-col gap-3 overflow-y-auto">
          {brands.length ? brands.map((brand) => (
            <label key={brand.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={filters.brandIds.includes(brand.id)} onCheckedChange={(checked) => toggleBrand(brand.id, checked === true)} />
              {brand.name}
            </label>
          )) : <p className="text-sm text-muted-foreground">{t("noBrands")}</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">{t("priceRange")}</h2>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            min={0}
            placeholder={t("priceFrom")}
            value={filters.minPrice ?? ""}
            onChange={(event) => updateFilters({ minPrice: event.target.value ? Number(event.target.value) : undefined })}
            aria-label={t("minimumPrice")}
          />
          <Input
            type="number"
            min={0}
            placeholder={t("priceTo")}
            value={filters.maxPrice ?? ""}
            onChange={(event) => updateFilters({ maxPrice: event.target.value ? Number(event.target.value) : undefined })}
            aria-label={t("maximumPrice")}
          />
        </div>
        <div className="mt-4 px-2">
          <Slider
            min={0}
            max={Math.max(1, maxProductPrice)}
            step={Math.max(1, Math.round(maxProductPrice / 100))}
            value={[filters.minPrice ?? 0, filters.maxPrice ?? maxProductPrice]}
            onValueChange={(value) => {
              const range = Array.isArray(value) ? value.map(Number) : [0, maxProductPrice];
              updateFilters({ minPrice: range[0] || undefined, maxPrice: range[1] >= maxProductPrice ? undefined : range[1] });
            }}
            aria-label={t("filterPriceRange")}
          />
        </div>
        {maxProductPrice > 0 && <p className="mt-2 text-xs text-muted-foreground">{t("highestPrice", { price: formatPrice(maxProductPrice) })}</p>}
      </section>

      <section>
        <h2 className="mb-3 font-semibold">{t("rating")}</h2>
        <div className="flex flex-col gap-3">
          {[4, 3, 2, 1].map((rating) => (
            <label key={rating} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={filters.minRating === rating} onCheckedChange={(checked) => updateFilters({ minRating: checked === true ? rating : undefined })} />
              <span className="flex items-center gap-1"><Star className="size-4 fill-amber-400 text-amber-400" /> {t("starsAndUp", { count: rating })}</span>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">{t("productStatus")}</h2>
        <div className="flex flex-col gap-3">
          {[
            { status: ProductStatus.InStock, label: t("inStock") },
            { status: ProductStatus.LowStock, label: t("lowStock") },
            { status: ProductStatus.OutOfStock, label: t("outOfStock") },
            { status: ProductStatus.PreOrder, label: t("preOrder") },
          ].map(({ status, label }) => (
            <label key={status} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={filters.statuses.includes(status)}
                onCheckedChange={(checked) => updateFilters({
                  statuses: checked === true
                    ? [...filters.statuses, status]
                    : filters.statuses.filter((item) => item !== status),
                })}
              />
              {label}
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={filters.discountedOnly} onCheckedChange={(checked) => updateFilters({ discountedOnly: checked === true })} /> {t("discountedOnly")}
          </label>
        </div>
      </section>

      <Button variant="outline" onClick={() => updateFilters(DEFAULT_FILTERS)}>{t("clearFilters")}</Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      <Breadcrumb className="mb-5">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink render={<Link href="/" />}>{t("home")}</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{category.categoryName}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{category.categoryName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("description", { count: products.length })}</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:items-start">
        <aside className="sticky top-20 hidden rounded-2xl border bg-card p-5 lg:col-span-1 lg:block">
          <h2 className="mb-5 text-lg font-semibold">{t("filter")}</h2>
          {filtersPanel}
        </aside>

        <section className="min-w-0 lg:col-span-3">
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3">
            <p className="mr-auto text-sm text-muted-foreground">{t("showingResults", { first: firstResult, last: lastResult, total: totalProducts })}</p>
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger render={<Button variant="outline" className="lg:hidden" />}><SlidersHorizontal /> {t("filter")}</SheetTrigger>
              <SheetContent side="left" className="overflow-y-auto p-5">
                <SheetHeader className="p-0 pb-5"><SheetTitle>{t("productFilters")}</SheetTitle></SheetHeader>
                {filtersPanel}
              </SheetContent>
            </Sheet>
            <Select
              value={sorting[0]?.id === "price" && !sorting[0].desc ? "price-asc" : sorting[0]?.id === "price" ? "price" : sorting[0]?.id === "rating" ? "rating" : "newest"}
              onValueChange={(value) => {
                const sortId = value == null ? "newest" : String(value);
                const columnId = sortId === "newest" ? "createdAt" : sortId === "price-asc" || sortId === "price" ? "price" : "rating";
                setSorting([{ id: columnId, desc: sortId !== "price-asc" }]);
                setPagination((current) => ({ ...current, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("sortNewest")}</SelectItem>
                <SelectItem value="price-asc">{t("sortPriceAscending")}</SelectItem>
                <SelectItem value="price">{t("sortPriceDescending")}</SelectItem>
                <SelectItem value="rating">{t("sortRating")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center rounded-xl border p-1" aria-label={t("viewMode")}>
              <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon-sm" aria-label={t("gridView")} onClick={() => setView("grid")}><Grid2X2 /></Button>
              <Button variant={view === "list" ? "secondary" : "ghost"} size="icon-sm" aria-label={t("listView")} onClick={() => setView("list")}><List /></Button>
            </div>
          </div>

          {table.getRowModel().rows.length ? (
            view === "grid" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {table.getRowModel().rows.map((row) => <ProductCard key={row.id} product={row.original} />)}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {table.getRowModel().rows.map((row) => <ProductListItem key={row.id} product={row.original} />)}
              </div>
            )
          ) : (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">{t("emptyResults")}</div>
          )}

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-sm text-muted-foreground">{t("pageOf", { current: pageIndex + 1, total: pageCount })}</p>
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem><PaginationPrevious href="#" text={t("previous")} onClick={(event) => { event.preventDefault(); if (table.getCanPreviousPage()) table.previousPage(); }} aria-disabled={!table.getCanPreviousPage()} /></PaginationItem>
                {pageLinks.map((index, linkIndex) => (
                  <Fragment key={index}>
                    {linkIndex > 0 && index - pageLinks[linkIndex - 1] > 1 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                    <PaginationItem><PaginationLink href={`?page=${index + 1}`} isActive={index === pageIndex} onClick={(event) => { event.preventDefault(); table.setPageIndex(index); }}>{index + 1}</PaginationLink></PaginationItem>
                  </Fragment>
                ))}
                <PaginationItem><PaginationNext href="#" text={t("next")} onClick={(event) => { event.preventDefault(); if (table.getCanNextPage()) table.nextPage(); }} aria-disabled={!table.getCanNextPage()} /></PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </section>
      </div>
    </div>
  );
}
