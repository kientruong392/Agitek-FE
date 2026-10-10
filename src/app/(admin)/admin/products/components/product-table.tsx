"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ColumnDef, flexRender, useTable, Row, tableFeatures, coreFeatures,
  columnVisibilityFeature, columnFilteringFeature, globalFilteringFeature,
  rowSortingFeature, columnFacetingFeature, rowPaginationFeature, createSortedRowModel,
  createFilteredRowModel
} from "@tanstack/react-table";
import type { HeaderGroup, Header, Cell } from "@tanstack/react-table";
import {
  MoreHorizontal, Pencil, Trash2, Loader2, RotateCcw, Flame,
  ArrowUpDown, Star,
} from "lucide-react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { softDeleteProduct, hardDeleteProduct, restoreProduct } from "@/actions/product.action";
import { ProductStatus, ProductStatusLabels } from "@/types/model.types";
import type { Product } from "@/types/model.types";
import EditProductDialog from "./edit-product-dialog";
import type { SortingState } from "@tanstack/react-table";

const features = tableFeatures({
  ...coreFeatures,
  columnVisibilityFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  columnFacetingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
});

type Features = typeof features;

const FALLBACK_IMAGE = "/images/no-image.png";

function getStatusVariant(status: ProductStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case ProductStatus.InStock: return "default";
    case ProductStatus.LowStock: return "secondary";
    case ProductStatus.OutOfStock: return "destructive";
    case ProductStatus.Deleted: return "destructive";
    case ProductStatus.Hidden: return "outline";
    case ProductStatus.Pending: return "outline";
    case ProductStatus.PreOrder: return "secondary";
    default: return "outline";
  }
}

function formatWarranty(months: number): string {
  if (months === 0) return "Không BH";
  if (months < 12) return `${months} tháng`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} năm`;
  return `${years} năm ${remainingMonths} tháng`;
}

function getPrimaryImage(product: Product): string {
  if (!product.images || product.images.length === 0) return FALLBACK_IMAGE;
  const primary = product.images.find((img) => img.isPrimary);
  return primary?.imageUrl || product.images[0]?.imageUrl || FALLBACK_IMAGE;
}

// --- Action cell for active products ---
function ActionsCell({ product, onDeleted, onUpdated }: { product: Product; onDeleted: () => void; onUpdated: () => void }) {
  const t = useTranslations("AdminProducts");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirmSoftDelete() {
    setIsDeleting(true);
    const res = await softDeleteProduct(product.id);
    setIsDeleting(false);
    if (res.success) {
      toast.add({ title: t("softDeleteSuccess"), type: "success" });
      setDeleteDialogOpen(false);
      onDeleted();
    } else {
      toast.add({ title: t(res.errorCode ?? "INTERNAL_SERVER_ERROR"), type: "error" });
    }
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={t("actions")} />}>
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
              <Pencil />
              {t("edit")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 />
            {t("softDelete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditProductDialog product={product} open={editDialogOpen} onOpenChange={setEditDialogOpen} onUpdated={onUpdated} />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("softDeleteConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("softDeleteConfirmDescription")}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
            <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image src={getPrimaryImage(product)} alt={product.productName} width={40} height={40} className="size-full object-cover" unoptimized />
            </div>
            <div>
              <p className="font-medium">{product.productName}</p>
              <p className="font-mono text-sm text-muted-foreground">{product.sku}</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>{t("cancel")}</Button>
            <Button type="button" variant="destructive" onClick={handleConfirmSoftDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("softDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- Action cell for deleted products ---
function DeletedActionsCell({ product, onChanged }: { product: Product; onChanged: () => void }) {
  const t = useTranslations("AdminProducts");
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleRestore() {
    setIsProcessing(true);
    const res = await restoreProduct(product.id);
    setIsProcessing(false);
    if (res.success) {
      toast.add({ title: t("restoreSuccess"), type: "success" });
      onChanged();
    } else {
      toast.add({ title: t(res.errorCode ?? "INTERNAL_SERVER_ERROR"), type: "error" });
    }
  }

  async function handleConfirmHardDelete() {
    setIsProcessing(true);
    const res = await hardDeleteProduct(product.id);
    setIsProcessing(false);
    if (res.success) {
      toast.add({ title: t("hardDeleteSuccess"), type: "success" });
      setHardDeleteDialogOpen(false);
      onChanged();
    } else {
      toast.add({ title: t(res.errorCode ?? "INTERNAL_SERVER_ERROR"), type: "error" });
    }
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={t("actions")} />}>
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleRestore} disabled={isProcessing}>
              <RotateCcw />
              {t("restore")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setHardDeleteDialogOpen(true)}>
            <Flame />
            {t("hardDelete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={hardDeleteDialogOpen} onOpenChange={setHardDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("hardDeleteConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("hardDeleteConfirmDescription")}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 rounded-lg border bg-destructive/10 px-4 py-3">
            <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image src={getPrimaryImage(product)} alt={product.productName} width={40} height={40} className="size-full object-cover" unoptimized />
            </div>
            <div>
              <p className="font-medium">{product.productName}</p>
              <p className="font-mono text-sm text-muted-foreground">{product.sku}</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setHardDeleteDialogOpen(false)} disabled={isProcessing}>{t("cancel")}</Button>
            <Button type="button" variant="destructive" onClick={handleConfirmHardDelete} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("hardDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- Column headers ---
function ProductHeader() { const t = useTranslations("AdminProducts"); return <span>{t("colProduct")}</span>; }
function StockHeader() { const t = useTranslations("AdminProducts"); return <span>{t("colStock")}</span>; }
function SoldHeader() { const t = useTranslations("AdminProducts"); return <span>{t("colSold")}</span>; }
function LossHeader() { const t = useTranslations("AdminProducts"); return <span>{t("colLoss")}</span>; }
function StatusHeader() { const t = useTranslations("AdminProducts"); return <span>{t("colStatus")}</span>; }
function RatingHeader() { const t = useTranslations("AdminProducts"); return <span>{t("colRating")}</span>; }
function WarrantyHeader() { const t = useTranslations("AdminProducts"); return <span>{t("colWarranty")}</span>; }
function ActionsHeaderCell() { const t = useTranslations("AdminProducts"); return <span className="flex justify-end">{t("actions")}</span>; }

function createColumns(onDeleted: () => void, onUpdated: () => void, showDeleted: boolean): ColumnDef<Features, Product>[] {
  return [
    {
      id: "product",
      accessorFn: (row) => row.productName,
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => (column as any).toggleSorting((column as any).getIsSorted() === "asc")}>
          <ProductHeader />
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }: { row: Row<Features, Product> }) => {
        const p = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image src={getPrimaryImage(p)} alt={p.productName} width={40} height={40} className="size-full object-cover" unoptimized />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium truncate">{p.productName}</span>
              <span className="font-mono text-xs text-muted-foreground">{p.sku}</span>
            </div>
          </div>
        );
      },
    },
    {
      id: "stock",
      accessorFn: (row) => row.stockQuantity,
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => (column as any).toggleSorting((column as any).getIsSorted() === "asc")}>
          <StockHeader />
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }: { row: Row<Features, Product> }) => (
        <span className="font-mono text-sm">{row.original.stockQuantity}/{row.original.initialQuantity}</span>
      ),
    },
    {
      id: "sold",
      accessorFn: (row) => row.soldQuantity,
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => (column as any).toggleSorting((column as any).getIsSorted() === "asc")}>
          <SoldHeader />
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }: { row: Row<Features, Product> }) => (
        <span className="font-mono text-sm">{row.original.soldQuantity}</span>
      ),
    },
    {
      id: "loss",
      accessorFn: (row) => row.initialQuantity - row.stockQuantity - row.soldQuantity,
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => (column as any).toggleSorting((column as any).getIsSorted() === "asc")}>
          <LossHeader />
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }: { row: Row<Features, Product> }) => {
        const loss = row.original.initialQuantity - row.original.stockQuantity - row.original.soldQuantity;
        return <span className={`font-mono text-sm ${loss > 0 ? "text-destructive" : ""}`}>{loss}</span>;
      },
    },
    {
      id: "status",
      accessorFn: (row) => row.status,
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => (column as any).toggleSorting((column as any).getIsSorted() === "asc")}>
          <StatusHeader />
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }: { row: Row<Features, Product> }) => (
        <Badge variant={getStatusVariant(row.original.status)}>{ProductStatusLabels[row.original.status]}</Badge>
      ),
    },
    {
      id: "rating",
      accessorFn: (row) => row.averageRating ?? 0,
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => (column as any).toggleSorting((column as any).getIsSorted() === "asc")}>
          <RatingHeader />
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }: { row: Row<Features, Product> }) => {
        const rating = row.original.averageRating ?? 0;
        return (
          <div className="flex items-center gap-1">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span className="font-mono text-sm">{rating.toFixed(1)}</span>
          </div>
        );
      },
    },
    {
      id: "warranty",
      accessorFn: (row) => row.warrantyPeriod,
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <WarrantyHeader />
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }: { row: Row<Features, Product> }) => (
        <span className="text-sm">{formatWarranty(row.original.warrantyPeriod)}</span>
      ),
    },
    {
      id: "actions",
      header: () => <ActionsHeaderCell />,
      cell: ({ row }: { row: Row<Features, Product> }) =>
        showDeleted
          ? <DeletedActionsCell product={row.original} onChanged={onDeleted} />
          : <ActionsCell product={row.original} onDeleted={onDeleted} onUpdated={onUpdated} />,
    },
  ];
}

interface ProductDataTableProps {
  data: Product[];
  onDeleted: () => void;
  onUpdated: () => void;
  showDeleted: boolean;
}

export default function ProductDataTable({ data, onDeleted, onUpdated, showDeleted }: ProductDataTableProps) {
  const t = useTranslations("AdminProducts");
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const columns = createColumns(onDeleted, onUpdated, showDeleted);

  // Filter data by status before passing to table
  const filteredData = data.filter((p) => {
    if (showDeleted) return p.status === ProductStatus.Deleted;
    if (statusFilter === "all") return p.status !== ProductStatus.Deleted;
    return p.status === Number(statusFilter) && p.status !== ProductStatus.Deleted;
  });

  const table = useTable({
    features,
    data: filteredData,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Input
          placeholder={t("searchPlaceholder")}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        {!showDeleted && (
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("filterStatus")}>
                {statusFilter === "all" ? t("filterAll") : ProductStatusLabels[parseInt(statusFilter) as ProductStatus]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filterAll")}</SelectItem>
              <SelectItem value="0">{ProductStatusLabels[ProductStatus.Pending]}</SelectItem>
              <SelectItem value="1">{ProductStatusLabels[ProductStatus.InStock]}</SelectItem>
              <SelectItem value="2">{ProductStatusLabels[ProductStatus.LowStock]}</SelectItem>
              <SelectItem value="3">{ProductStatusLabels[ProductStatus.OutOfStock]}</SelectItem>
              <SelectItem value="4">{ProductStatusLabels[ProductStatus.Hidden]}</SelectItem>
              <SelectItem value="5">{ProductStatusLabels[ProductStatus.PreOrder]}</SelectItem>
            </SelectContent>
          </Select>
        )}
        <div className="ml-auto text-sm text-muted-foreground">
          {t("totalProducts", { count: filteredData.length })}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<Features, Product>) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: Header<Features, Product, unknown>) => (
                  <TableHead key={header.id} className={header.id === "actions" ? "text-right" : ""}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row: Row<Features, Product>) => (
                <TableRow key={row.id} className={row.original.deletedAt ? "opacity-50 border-dashed bg-muted/20" : ""}>
                  {row.getVisibleCells().map((cell: Cell<Features, Product, unknown>) => (
                    <TableCell key={cell.id} className={cell.column.id === "actions" ? "text-right" : ""}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {t("pageInfo", {
            current: table.state.pagination.pageIndex + 1,
            total: table.getPageCount() || 1,
          })}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            {t("prevPage")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            {t("nextPage")}
          </Button>
        </div>
      </div>
    </div>
  );
}
