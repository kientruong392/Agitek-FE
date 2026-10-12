"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  ColumnDef, flexRender, useTable, Row, tableFeatures, coreFeatures,
  columnVisibilityFeature, columnFilteringFeature, globalFilteringFeature,
  rowSortingFeature, columnFacetingFeature, rowPaginationFeature,
  createSortedRowModel, createFilteredRowModel, createPaginatedRowModel,
} from "@tanstack/react-table";
import type { HeaderGroup, Header, Cell, SortingState } from "@tanstack/react-table";
import {
  MoreHorizontal, Pencil, Trash2, MapPin, ArrowUpDown, Loader2,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { deleteLocation } from "@/actions/location.action";
import { LocationStatus, LocationStatusLabels } from "@/types/model.types";
import type { LocationDTO } from "@/types/model.types";
import LocationFormDialog from "./location-form-dialog";

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

function getStatusBadge(status: LocationStatus | null) {
  switch (status) {
    case LocationStatus.Active:
      return (
        <Badge variant="default" className="gap-1.5 font-normal text-xs bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border border-emerald-600/20">
          {LocationStatusLabels[LocationStatus.Active]}
        </Badge>
      );
    case LocationStatus.Inactive:
      return (
        <Badge variant="default" className="gap-1.5 font-normal text-xs bg-red-600/10 text-red-700 dark:text-red-400 border border-red-600/20">
          {LocationStatusLabels[LocationStatus.Inactive]}
        </Badge>
      );
    case LocationStatus.Maintenance:
      return (
        <Badge variant="default" className="gap-1.5 font-normal text-xs bg-amber-600/10 text-amber-700 dark:text-amber-400 border border-amber-600/20">
          {LocationStatusLabels[LocationStatus.Maintenance]}
        </Badge>
      );
    default:
      return (
        <Badge variant="default" className="gap-1.5 font-normal text-xs bg-muted text-muted-foreground border">
          Chưa xác định
        </Badge>
      );
  }
}

function ActionsCell({
  location,
  onUpdated,
}: {
  location: LocationDTO;
  onUpdated: () => void;
}) {
  const t = useTranslations("AdminLocations");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteLocation(location.id);
      if (res.success) {
        toast.add({ title: t("deleteSuccess"), type: "success" });
        setDeleteDialogOpen(false);
        onUpdated();
      } else {
        toast.add({ title: res.message || t("INTERNAL_SERVER_ERROR"), type: "error" });
      }
    } catch {
      toast.add({ title: t("INTERNAL_SERVER_ERROR"), type: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label={t("actions")} />}>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <Pencil className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{t("edit")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span>{t("delete")}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit Form Dialog (controlled, not nested in any button) */}
      <LocationFormDialog
        mode="edit"
        initialData={location}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={onUpdated}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(val) => { if (!isDeleting) setDeleteDialogOpen(val); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("deleteConfirmDesc")}</DialogDescription>
          </DialogHeader>
          <div className="p-3 bg-muted/50 rounded-lg text-sm border flex items-center gap-3">
            <span className="font-mono font-bold text-primary px-2 py-1 bg-background rounded border">
              {location.locationCode}
            </span>
            <span className="text-muted-foreground truncate">{location.locationName}</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function createColumns(onUpdated: () => void): ColumnDef<Features, LocationDTO>[] {
  return [
    {
      accessorKey: "locationCode",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Mã kho
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <span className="font-mono font-bold tracking-wider px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs inline-block">
          {row.original.locationCode}
        </span>
      ),
    },
    {
      accessorKey: "locationName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tên vị trí / Địa chỉ kho
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex items-start gap-2 max-w-lg py-1">
          <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span className="text-sm font-medium leading-snug line-clamp-2">
            {row.original.locationName}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: "actions",
      header: () => <span className="text-right block">Thao tác</span>,
      cell: ({ row }) => <ActionsCell location={row.original} onUpdated={onUpdated} />,
    },
  ];
}

interface LocationTableProps {
  data: LocationDTO[];
  onUpdated: () => void;
}

export default function LocationDataTable({ data, onUpdated }: LocationTableProps) {
  const t = useTranslations("AdminLocations");
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const columns = useMemo(() => createColumns(onUpdated), [onUpdated]);

  const filteredData = useMemo(() => {
    if (!globalFilter.trim()) return data;
    const lower = globalFilter.toLowerCase();
    return data.filter(
      (loc) =>
        loc.locationCode.toLowerCase().includes(lower) ||
        loc.locationName.toLowerCase().includes(lower)
    );
  }, [data, globalFilter]);

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
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Controls Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Input
            value={globalFilter}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-10 text-sm"
          />
        </div>
        <div className="text-xs font-medium text-muted-foreground sm:text-right">
          {t("totalWarehouses", { count: filteredData.length })}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<Features, LocationDTO>) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: Header<Features, LocationDTO, unknown>) => (
                  <TableHead key={header.id} className={header.id === "actions" ? "text-right" : ""}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row: Row<Features, LocationDTO>) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell: Cell<Features, LocationDTO, unknown>) => (
                    <TableCell key={cell.id} className={cell.column.id === "actions" ? "text-right" : ""}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-28 text-center text-muted-foreground">
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {t("pageInfo", {
            current: table.state.pagination.pageIndex + 1,
            total: table.getPageCount() || 1,
          })}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(table.state.pagination.pageSize)}
            onValueChange={(val) => table.setPageSize(Number(val))}
          >
            <SelectTrigger className="w-[70px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t("prevPage")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t("nextPage")}
          </Button>
        </div>
      </div>
    </div>
  );
}
