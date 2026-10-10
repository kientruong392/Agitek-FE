"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ColumnDef, flexRender, useTable, Row, tableFeatures, coreFeatures,
  columnVisibilityFeature, columnFilteringFeature, globalFilteringFeature,
  rowSortingFeature, columnFacetingFeature, rowPaginationFeature,
  createSortedRowModel, createFilteredRowModel,
} from "@tanstack/react-table";
import type { HeaderGroup, Header, Cell, SortingState } from "@tanstack/react-table";
import {
  MoreHorizontal, Eye, ShieldAlert, ShieldCheck, ArrowUpDown, Loader2,
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
import { toggleUserActive } from "@/actions/user.action";
import { RoleName, RoleNameLabels } from "@/types/model.types";
import type { UserDTO } from "@/types/model.types";
import ViewUserDialog from "../../components/view-user-dialog";

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

const FALLBACK_AVATAR = "/images/no-image.png";

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// --- Action cell ---
function ActionsCell({ user, onUpdated }: { user: UserDTO; onUpdated: () => void }) {
  const t = useTranslations("AdminUsers");
  const [viewOpen, setViewOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleToggleActive() {
    setIsProcessing(true);
    const res = await toggleUserActive(user.id, !user.isActive);
    setIsProcessing(false);
    if (res.success) {
      toast.add({ title: t(user.isActive ? "banSuccess" : "unbanSuccess"), type: "success" });
      setBanDialogOpen(false);
      onUpdated();
    } else {
      toast.add({ title: t(res.errorCode ?? "INTERNAL_SERVER_ERROR"), type: "error" });
    }
  }

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
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setBanDialogOpen(true)} className={user.isActive ? "text-destructive" : "text-emerald-600"}>
            {user.isActive ? (
              <><ShieldAlert className="mr-2 size-4" />{t("banAccount")}</>
            ) : (
              <><ShieldCheck className="mr-2 size-4" />{t("unbanAccount")}</>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ViewUserDialog user={user} open={viewOpen} onOpenChange={setViewOpen} onUpdated={onUpdated} showRoleGrant={false} />

      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{user.isActive ? t("banConfirmTitle") : t("unbanConfirmTitle")}</DialogTitle>
            <DialogDescription>{user.isActive ? t("banConfirmDescription") : t("unbanConfirmDescription")}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
            <div className="size-10 shrink-0 overflow-hidden rounded-full bg-muted">
              <Image src={user.profile?.avatarUrl || FALLBACK_AVATAR} alt={user.username} width={40} height={40} className="size-full object-cover" unoptimized />
            </div>
            <div>
              <p className="font-medium">{user.profile?.fullName || user.username}</p>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBanDialogOpen(false)} disabled={isProcessing}>{t("cancel")}</Button>
            <Button type="button" variant={user.isActive ? "destructive" : "default"} onClick={handleToggleActive} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 size-4 animate-spin" />}
              {user.isActive ? t("banAccount") : t("unbanAccount")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- Column headers ---
function UserHeader() { const t = useTranslations("AdminUsers"); return <span>{t("colUser")}</span>; }
function EmailHeader() { const t = useTranslations("AdminUsers"); return <span>{t("colEmail")}</span>; }
function RoleHeader() { const t = useTranslations("AdminUsers"); return <span>{t("colRole")}</span>; }
function StatusHeader() { const t = useTranslations("AdminUsers"); return <span>{t("colStatus")}</span>; }
function VerifiedHeader() { const t = useTranslations("AdminUsers"); return <span>{t("colVerified")}</span>; }
function CreatedAtHeader() { const t = useTranslations("AdminUsers"); return <span>{t("colCreatedAt")}</span>; }
function ActionsHeaderCell() { const t = useTranslations("AdminUsers"); return <span className="flex justify-end">{t("actions")}</span>; }

function createColumns(onUpdated: () => void): ColumnDef<Features, UserDTO>[] {
  return [
    {
      id: "user",
      accessorFn: (row) => `${row.profile?.fullName || ""} ${row.username}`,
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <UserHeader />
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }: { row: Row<Features, UserDTO> }) => {
        const u = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="size-9 shrink-0 overflow-hidden rounded-full bg-muted">
              <Image src={u.profile?.avatarUrl || FALLBACK_AVATAR} alt={u.username} width={36} height={36} className="size-full object-cover" unoptimized />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium truncate">{u.profile?.fullName || u.username}</span>
              <span className="text-xs text-muted-foreground">@{u.username}</span>
            </div>
          </div>
        );
      },
    },
    {
      id: "email",
      accessorFn: (row) => row.email,
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <EmailHeader />
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }: { row: Row<Features, UserDTO> }) => (
        <span className="text-sm">{row.original.email}</span>
      ),
    },
    {
      id: "role",
      accessorFn: (row) => row.role,
      header: () => <RoleHeader />,
      cell: ({ row }: { row: Row<Features, UserDTO> }) => (
        <Badge variant="secondary">{RoleNameLabels[row.original.role]}</Badge>
      ),
    },
    {
      id: "status",
      accessorFn: (row) => row.isActive,
      header: () => <StatusHeader />,
      cell: ({ row }: { row: Row<Features, UserDTO> }) => (
        <Badge variant={row.original.isActive ? "default" : "destructive"}>
          {row.original.isActive ? "Hoạt động" : "Đã cấm"}
        </Badge>
      ),
    },
    {
      id: "verified",
      accessorFn: (row) => row.isVerified,
      header: () => <VerifiedHeader />,
      cell: ({ row }: { row: Row<Features, UserDTO> }) => (
        <Badge variant={row.original.isVerified ? "default" : "outline"}>
          {row.original.isVerified ? "Đã xác minh" : "Chưa xác minh"}
        </Badge>
      ),
    },
    {
      id: "createdAt",
      accessorFn: (row) => row.createdAt,
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <CreatedAtHeader />
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }: { row: Row<Features, UserDTO> }) => (
        <span className="text-sm">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: "actions",
      header: () => <ActionsHeaderCell />,
      cell: ({ row }: { row: Row<Features, UserDTO> }) => (
        <div className="flex justify-end">
          <ActionsCell user={row.original} onUpdated={onUpdated} />
        </div>
      ),
    },
  ];
}

interface CustomerDataTableProps {
  data: UserDTO[];
  onUpdated: () => void;
}

export default function CustomerDataTable({ data, onUpdated }: CustomerDataTableProps) {
  const t = useTranslations("AdminUsers");
  const [globalFilter, setGlobalFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const columns = createColumns(onUpdated);

  const filteredData = data.filter((u) => {
    if (roleFilter === "all") return true;
    return u.role === Number(roleFilter);
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
        <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val || "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("filterRole")}>
              {roleFilter === "all" ? t("filterAll") : RoleNameLabels[parseInt(roleFilter) as RoleName]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            <SelectItem value={String(RoleName.Customer)}>{RoleNameLabels[RoleName.Customer]}</SelectItem>
            <SelectItem value={String(RoleName.Guest)}>{RoleNameLabels[RoleName.Guest]}</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-muted-foreground">
          {t("totalUsers", { count: filteredData.length })}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<Features, UserDTO>) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: Header<Features, UserDTO, unknown>) => (
                  <TableHead key={header.id} className={header.id === "actions" ? "text-right" : ""}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row: Row<Features, UserDTO>) => (
                <TableRow key={row.id} className={!row.original.isActive ? "opacity-60 bg-muted/20" : ""}>
                  {row.getVisibleCells().map((cell: Cell<Features, UserDTO, unknown>) => (
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
