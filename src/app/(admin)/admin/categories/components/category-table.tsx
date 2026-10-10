"use client";

import { useTranslations } from "next-intl";
import { ColumnDef, flexRender, useTable, Row, tableFeatures, coreFeatures, rowExpandingFeature, columnVisibilityFeature, createExpandedRowModel } from "@tanstack/react-table";
import type { HeaderGroup, Header, Cell } from "@tanstack/react-table";

const features = tableFeatures({
  ...coreFeatures,
  rowExpandingFeature,
  columnVisibilityFeature,
  expandedRowModel: createExpandedRowModel(),
});

type Features = typeof features;
import { ChevronRight, MoreHorizontal, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { deleteCategory, getCategoryByIdWithProducts } from "@/actions/category.action";
import type { Category } from "@/types/model.types";
import ViewCategoryDialog from "./view-category-dialog";
import EditCategoryDialog from "./edit-category-dialog";

function ActionsCell({ category, onDeleted, onUpdated }: { category: Category; onDeleted: () => void; onUpdated: () => void }) {
  const t = useTranslations("AdminCategories");

  const isLeaf = !category.subCategories || category.subCategories.length === 0;
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [categoryDetails, setCategoryDetails] = useState<Category | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleViewDetail() {
    if (!isLeaf) return;
    const res = await getCategoryByIdWithProducts(category.id);
    if (res.success && res.data) {
      setCategoryDetails(res.data);
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
    const res = await deleteCategory(category.id);
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
            <DropdownMenuItem onClick={handleViewDetail} disabled={!isLeaf}>
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

      <ViewCategoryDialog category={categoryDetails} open={viewDialogOpen} onOpenChange={setViewDialogOpen} />
      <EditCategoryDialog category={category} open={editDialogOpen} onOpenChange={setEditDialogOpen} onUpdated={onUpdated} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("deleteConfirmDescription")}</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/50 px-4 py-3">
            <p className="font-medium">{category.categoryName}</p>
            <p className="font-mono text-sm text-muted-foreground">#{category.code}</p>
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

function createColumns(onDeleted: () => void, onUpdated: () => void): ColumnDef<Features, Category>[] {
  return [
    {
      accessorKey: "code",
      header: () => <CategoryCodeHeader />,
      cell: ({ row }: { row: Row<Features, Category> }) => <CategoryCodeCell row={row} />,
    },
    {
      accessorKey: "categoryName",
      header: () => <CategoryNameHeader />,
      cell: ({ row }: { row: Row<Features, Category> }) => <span>{row.original.categoryName}</span>,
    },
    {
      id: "actions",
      header: () => <ActionsHeader />,
      cell: ({ row }: { row: Row<Features, Category> }) => <ActionsCell category={row.original} onDeleted={onDeleted} onUpdated={onUpdated} />,
    },
  ];
}

function CategoryCodeHeader() {
  const t = useTranslations("AdminCategories");
  return <span>{t("code")}</span>;
}

function CategoryNameHeader() {
  const t = useTranslations("AdminCategories");
  return <span>{t("name")}</span>;
}

function ActionsHeader() {
  const t = useTranslations("AdminCategories");
  return <span className="flex justify-end">{t("actions")}</span>;
}

function CategoryCodeCell({ row }: { row: Row<Features, Category> }) {
  const depth = row.depth;
  const canExpand = row.getCanExpand();
  return (
    <div
      className="flex items-center gap-1.5"
      style={{ paddingLeft: `${depth * 1.5}rem` }}
    >
      <button
        type="button"
        className={`flex size-6 shrink-0 items-center justify-center rounded-md transition-colors ${canExpand ? "hover:bg-muted cursor-pointer" : "invisible"}`}
        onClick={(e) => {
          e.stopPropagation();
          row.toggleExpanded();
        }}
        aria-label="Toggle expand"
      >
        <ChevronRight
          className={`size-4 transition-transform duration-200 ${row.getIsExpanded() ? "rotate-90" : ""}`}
        />
      </button>
      <span className="font-mono text-sm font-medium">{row.original.code}</span>
    </div>
  );
}

interface CategoryDataTableProps {
  data: Category[];
  onDeleted: () => void;
  onUpdated: () => void;
}

export default function CategoryDataTable({ data, onDeleted, onUpdated }: CategoryDataTableProps) {
  const t = useTranslations("AdminCategories");
  const columns = createColumns(onDeleted, onUpdated);

  const table = useTable({
    features,
    data,
    columns,
    getSubRows: (row) => row.subCategories,
  });

  return (
    <div className="rounded-2xl border bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup: HeaderGroup<Features, Category>) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header: Header<Features, Category, unknown>) => (
                <TableHead key={header.id} className={header.id === "actions" ? "text-right" : ""}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row: Row<Features, Category>) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => row.getCanExpand() && row.toggleExpanded()}
                aria-expanded={row.getIsExpanded()}
              >
                {row.getVisibleCells().map((cell: Cell<Features, Category, unknown>) => (
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
