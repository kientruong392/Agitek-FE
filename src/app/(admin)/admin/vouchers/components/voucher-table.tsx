"use client";

import { useTranslations } from "next-intl";
import {
  ColumnDef, flexRender, useTable, Row, tableFeatures, coreFeatures,
  columnVisibilityFeature, columnFilteringFeature, globalFilteringFeature,
  rowSortingFeature, columnFacetingFeature, rowPaginationFeature,
  createSortedRowModel, createFilteredRowModel, createPaginatedRowModel,
} from "@tanstack/react-table";
import type { HeaderGroup, Header, Cell, SortingState } from "@tanstack/react-table";
import {
  MoreHorizontal, Eye, Pencil, ArrowUpDown, Loader2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DiscountType, VoucherStatus, VoucherStatusLabels } from "@/types/model.types";
import type { VoucherDTO } from "@/types/model.types";
import ViewVoucherDialog from "./view-voucher-dialog";
import EditVoucherDialog from "./edit-voucher-dialog";

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
  paginatedRowModel: createPaginatedRowModel(),
});

type Features = typeof features;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function getStatusVariant(status: VoucherStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case VoucherStatus.Active: return "default";
    case VoucherStatus.Inactive: return "outline";
    case VoucherStatus.Expired: return "secondary";
    case VoucherStatus.LowStock: return "secondary";
    case VoucherStatus.OutOfStock: return "destructive";
    default: return "outline";
  }
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// --- Action cell ---
function ActionsCell({ voucher, onUpdated }: { voucher: VoucherDTO; onUpdated: () => void }) {
  const t = useTranslations("AdminVouchers");
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setViewOpen(true)}>
              <Eye className="mr-2 size-4" />{t("viewDetail")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 size-4" />{t("edit")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ViewVoucherDialog voucher={voucher} open={viewOpen} onOpenChange={setViewOpen} />
      <EditVoucherDialog voucher={voucher} open={editOpen} onOpenChange={setEditOpen} onUpdated={onUpdated} />
    </>
  );
}

// --- Column headers ---
function VoucherHeader() { const t = useTranslations("AdminVouchers"); return <span>{t("colVoucher")}</span>; }
function DiscountHeader() { const t = useTranslations("AdminVouchers"); return <span>{t("colDiscount")}</span>; }
function QuantityHeader() { const t = useTranslations("AdminVouchers"); return <span>{t("colQuantity")}</span>; }
function DatesHeader() { const t = useTranslations("AdminVouchers"); return <span>{t("colDates")}</span>; }
function StatusHeader() { const t = useTranslations("AdminVouchers"); return <span>{t("colStatus")}</span>; }
function ActionsHeaderCell() { const t = useTranslations("AdminVouchers"); return <span className="flex justify-end">{t("actions")}</span>; }

function createColumns(onUpdated: () => void): ColumnDef<Features, VoucherDTO>[] {
  return [
    {
      id: "voucher",
      accessorFn: (row) => row.name,
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <VoucherHeader />
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }: { row: Row<Features, VoucherDTO> }) => {
        const v = row.original;
        return (
          <div className="flex flex-col min-w-0 py-1">
            <span className="font-medium truncate">{v.name}</span>
            <span className="font-mono text-xs text-muted-foreground">{v.code}</span>
          </div>
        );
      },
    },
    {
      id: "discount",
      accessorFn: (row) => row.discountValue,
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <DiscountHeader />
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }: { row: Row<Features, VoucherDTO> }) => {
        const v = row.original;
        const discountText = v.discountType === DiscountType.Percentage
          ? `${v.discountValue}%`
          : formatCurrency(v.discountValue);
        return <span className="font-mono text-sm">{discountText}</span>;
      },
    },
    {
      id: "quantity",
      accessorFn: (row) => row.quantity,
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <QuantityHeader />
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }: { row: Row<Features, VoucherDTO> }) => (
        <div className="flex flex-col py-1">
          <span className="font-mono text-sm">{row.original.quantity} / {row.original.initialQuantity}</span>
          <span className="text-xs text-muted-foreground">Đã dùng: {row.original.usedCount}</span>
        </div>
      ),
    },
    {
      id: "dates",
      accessorFn: (row) => row.startDate,
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <DatesHeader />
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }: { row: Row<Features, VoucherDTO> }) => (
        <div className="flex flex-col text-xs text-muted-foreground">
          <span>{formatDate(row.original.startDate)} - {formatDate(row.original.endDate)}</span>
        </div>
      ),
    },
    {
      id: "status",
      accessorFn: (row) => row.status,
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <StatusHeader />
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }: { row: Row<Features, VoucherDTO> }) => (
        <Badge variant={getStatusVariant(row.original.status)}>{VoucherStatusLabels[row.original.status]}</Badge>
      ),
    },
    {
      id: "actions",
      header: () => <ActionsHeaderCell />,
      cell: ({ row }: { row: Row<Features, VoucherDTO> }) => (
        <div className="flex justify-end">
          <ActionsCell voucher={row.original} onUpdated={onUpdated} />
        </div>
      ),
    },
  ];
}

interface VoucherDataTableProps {
  data: VoucherDTO[];
  onUpdated: () => void;
}

export default function VoucherDataTable({ data, onUpdated }: VoucherDataTableProps) {
  const t = useTranslations("AdminVouchers");
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const columns = useMemo(() => createColumns(onUpdated), [onUpdated]);

  const filteredData = useMemo(() => {
    if (statusFilter === "all") return data;
    return data.filter((v) => v.status === Number(statusFilter));
  }, [data, statusFilter]);

  const table = useTable({
    features,
    data: filteredData,
    columns,
    autoResetPageIndex: false,
    state: {
      globalFilter,
      sorting,
      pagination,
    },
    onGlobalFilterChange: (val) => {
      setGlobalFilter(val);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Input
          placeholder={t("searchPlaceholder")}
          value={globalFilter}
          onChange={(e) => {
            setGlobalFilter(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(val) => {
            setStatusFilter(val || "all");
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("filterStatus")}>
              {statusFilter === "all" ? t("filterAll") : VoucherStatusLabels[parseInt(statusFilter) as VoucherStatus]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            <SelectItem value="0">{VoucherStatusLabels[VoucherStatus.Active]}</SelectItem>
            <SelectItem value="1">{VoucherStatusLabels[VoucherStatus.Inactive]}</SelectItem>
            <SelectItem value="2">{VoucherStatusLabels[VoucherStatus.Expired]}</SelectItem>
            <SelectItem value="3">{VoucherStatusLabels[VoucherStatus.LowStock]}</SelectItem>
            <SelectItem value="4">{VoucherStatusLabels[VoucherStatus.OutOfStock]}</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-muted-foreground">
          {t("totalVouchers", { count: filteredData.length })}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<Features, VoucherDTO>) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: Header<Features, VoucherDTO, unknown>) => (
                  <TableHead key={header.id} className={header.id === "actions" ? "text-right" : ""}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row: Row<Features, VoucherDTO>) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell: Cell<Features, VoucherDTO, unknown>) => (
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
          <Select value={String(table.state.pagination.pageSize)} onValueChange={(val) => table.setPageSize(Number(val))}>
            <SelectTrigger className="w-[70px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50].map(size => (
                <SelectItem key={size} value={String(size)}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
