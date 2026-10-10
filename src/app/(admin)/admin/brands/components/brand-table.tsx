"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ColumnDef, flexRender, useTable, Row, tableFeatures, coreFeatures, columnVisibilityFeature } from "@tanstack/react-table";
import type { HeaderGroup, Header, Cell } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { deleteBrand, getBrandByIdWithProducts } from "@/actions/brand.action";
import type { Brand } from "@/types/model.types";
import ViewBrandDialog from "./view-brand-dialog";
import EditBrandDialog from "./edit-brand-dialog";

const features = tableFeatures({
  ...coreFeatures,
  columnVisibilityFeature,
});

type Features = typeof features;

const FALLBACK_LOGO = "/images/no-image.png";

function ActionsCell({ brand, onDeleted, onUpdated }: { brand: Brand; onDeleted: () => void; onUpdated: () => void }) {
  const t = useTranslations("AdminBrands");

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [brandDetails, setBrandDetails] = useState<Brand | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleViewDetail() {
    const res = await getBrandByIdWithProducts(brand.id);
    if (res.success && res.data) {
      setBrandDetails(res.data);
      setViewDialogOpen(true);
    } else {
      toast.add({ title: t(res.errorCode ?? "INTERNAL_SERVER_ERROR"), type: "error" });
    }
  }

  function handleEdit() {
    setEditDialogOpen(true);
  }

  function handleDeleteClick() {
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    setIsDeleting(true);
    const res = await deleteBrand(brand.id);
    setIsDeleting(false);
    if (res.success) {
      toast.add({ title: t("deleteSuccess"), type: "success" });
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
            <DropdownMenuItem onClick={handleViewDetail}>
              <Eye />
              {t("viewDetail")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEdit}>
              <Pencil />
              {t("edit")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleDeleteClick}>
            <Trash2 />
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ViewBrandDialog brand={brandDetails} open={viewDialogOpen} onOpenChange={setViewDialogOpen} />
      <EditBrandDialog brand={brand} open={editDialogOpen} onOpenChange={setEditDialogOpen} onUpdated={onUpdated} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("deleteConfirmDescription")}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
            <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image
                src={brand.logoUrl || FALLBACK_LOGO}
                alt={brand.name}
                width={40}
                height={40}
                className="size-full object-cover"
                unoptimized
              />
            </div>
            <div>
              <p className="font-medium">{brand.name}</p>
              <p className="font-mono text-sm text-muted-foreground">#{brand.code}</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              {t("cancel")}
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function LogoHeader() {
  const t = useTranslations("AdminBrands");
  return <span>{t("logo")}</span>;
}

function CodeHeader() {
  const t = useTranslations("AdminBrands");
  return <span>{t("code")}</span>;
}

function NameHeader() {
  const t = useTranslations("AdminBrands");
  return <span>{t("name")}</span>;
}

function ActionsHeader() {
  const t = useTranslations("AdminBrands");
  return <span className="flex justify-end">{t("actions")}</span>;
}

function createColumns(onDeleted: () => void, onUpdated: () => void): ColumnDef<Features, Brand>[] {
  return [
    {
      id: "logo",
      header: () => <LogoHeader />,
      cell: ({ row }: { row: Row<Features, Brand> }) => (
        <div className="size-9 shrink-0 overflow-hidden rounded-lg bg-muted">
          <Image
            src={row.original.logoUrl || FALLBACK_LOGO}
            alt={row.original.name}
            width={36}
            height={36}
            className="size-full object-cover"
            unoptimized
          />
        </div>
      ),
    },
    {
      accessorKey: "code",
      header: () => <CodeHeader />,
      cell: ({ row }: { row: Row<Features, Brand> }) => (
        <span className="font-mono text-sm font-medium">{row.original.code}</span>
      ),
    },
    {
      accessorKey: "name",
      header: () => <NameHeader />,
      cell: ({ row }: { row: Row<Features, Brand> }) => <span>{row.original.name}</span>,
    },
    {
      id: "actions",
      header: () => <ActionsHeader />,
      cell: ({ row }: { row: Row<Features, Brand> }) => <ActionsCell brand={row.original} onDeleted={onDeleted} onUpdated={onUpdated} />,
    },
  ];
}

interface BrandDataTableProps {
  data: Brand[];
  onDeleted: () => void;
  onUpdated: () => void;
}

export default function BrandDataTable({ data, onDeleted, onUpdated }: BrandDataTableProps) {
  const t = useTranslations("AdminBrands");
  const columns = createColumns(onDeleted, onUpdated);

  const table = useTable({
    features,
    data,
    columns,
  });

  return (
    <div className="rounded-2xl border bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup: HeaderGroup<Features, Brand>) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header: Header<Features, Brand, unknown>) => (
                <TableHead key={header.id} className={header.id === "actions" ? "text-right" : ""}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row: Row<Features, Brand>) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell: Cell<Features, Brand, unknown>) => (
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
  );
}
