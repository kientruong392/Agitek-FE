"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowUpDown, Check, Eye, Loader2, MoreHorizontal, Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Cell, ColumnDef, Header, HeaderGroup, Row, SortingState } from "@tanstack/react-table";
import {
  columnFilteringFeature, columnVisibilityFeature, coreFeatures, createFilteredRowModel,
  createPaginatedRowModel, createSortedRowModel, flexRender, globalFilteringFeature,
  rowPaginationFeature, rowSortingFeature, tableFeatures, useTable,
} from "@tanstack/react-table";
import { processWarranty } from "@/actions/warranty.action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { MediaType, WarrantyStatus } from "@/types/model.types";
import type { ReviewMedia, Warranty } from "@/types/model.types";

const ALL = "all";

const features = tableFeatures({
  ...coreFeatures,
  columnVisibilityFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

type Features = typeof features;
type Translator = ReturnType<typeof useTranslations>;

const statusKeys = {
  [WarrantyStatus.Pending]: "statuses.pending",
  [WarrantyStatus.Processing]: "statuses.processing",
  [WarrantyStatus.Completed]: "statuses.completed",
  [WarrantyStatus.Rejected]: "statuses.rejected",
} as const;

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString(locale === "en" ? "en-US" : "vi-VN");
}

function warrantyStatusVariant(status: WarrantyStatus): "default" | "secondary" | "destructive" {
  if (status === WarrantyStatus.Completed) return "default";
  if (status === WarrantyStatus.Rejected) return "destructive";
  return "secondary";
}

function statusLabel(t: Translator, status: WarrantyStatus) {
  return t(statusKeys[status]);
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground">{label}</p><div>{children}</div></div>;
}

function WarrantyMediaItem({ media, index }: { media: ReviewMedia; index: number }) {
  const t = useTranslations("WarrantyAdmin");
  const label = t("attachmentLabel", { index: index + 1 });
  if (media.mediaType === MediaType.Video) return <video src={media.mediaUrl} controls preload="metadata" aria-label={label} className="h-28 w-44 rounded-lg border bg-muted object-cover" />;
  return <a href={media.mediaUrl} target="_blank" rel="noreferrer" aria-label={label} className="group relative block size-28 overflow-hidden rounded-lg border bg-muted"><Image src={media.mediaUrl} alt={label} fill className="object-cover transition-transform group-hover:scale-105" unoptimized /></a>;
}

function availableDecisions(status: WarrantyStatus): WarrantyStatus[] {
  if (status === WarrantyStatus.Pending) return [WarrantyStatus.Processing, WarrantyStatus.Rejected];
  if (status === WarrantyStatus.Processing) return [WarrantyStatus.Completed, WarrantyStatus.Rejected];
  return [];
}

function decisionLabel(t: Translator, status: WarrantyStatus) {
  if (status === WarrantyStatus.Processing) return t("approve");
  if (status === WarrantyStatus.Completed) return t("complete");
  return t("reject");
}

function decisionDescription(t: Translator, status: WarrantyStatus) {
  if (status === WarrantyStatus.Processing) return t("approveDescription");
  if (status === WarrantyStatus.Completed) return t("completeDescription");
  return t("rejectDescription");
}

function WarrantyActionCell({ warranty, onUpdated }: { warranty: Warranty; onUpdated: () => void }) {
  const t = useTranslations("WarrantyAdmin");
  const locale = useLocale();
  const [detailOpen, setDetailOpen] = useState(false);
  const decisions = availableDecisions(warranty.status);
  const [decision, setDecision] = useState<WarrantyStatus>(decisions[0] ?? WarrantyStatus.Rejected);
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canProcess = decisions.length > 0;
  const customer = warranty.user?.profile;

  function handleDetailOpenChange(nextOpen: boolean) {
    if (isSubmitting) return;
    setDetailOpen(nextOpen);
    if (nextOpen) {
      setDecision(decisions[0] ?? WarrantyStatus.Rejected);
      setResponse(warranty.response || "");
    }
  }

  async function handleDecision() {
    if (!response.trim()) {
      toast.add({ title: t("responseRequired"), type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await processWarranty(warranty.id, {
        status: decision as WarrantyStatus.Processing | WarrantyStatus.Completed | WarrantyStatus.Rejected,
        response: response.trim(),
      });
      if (!result.success) {
        toast.add({ title: result.message || t("updateFailed"), type: "error" });
        return;
      }
      toast.add({ title: t("updateSuccess", { action: decisionLabel(t, decision) }), type: "success" });
      setDetailOpen(false);
      onUpdated();
    } finally {
      setIsSubmitting(false);
    }
  }

  return <>
    <DropdownMenu modal={false}><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={t("actionLabel")} />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleDetailOpenChange(true)}><Eye />{t("viewDetails")}</DropdownMenuItem></DropdownMenuContent></DropdownMenu>

    <Dialog open={detailOpen} onOpenChange={handleDetailOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto sm:max-w-4xl">
        <DialogHeader><DialogTitle>{t("detailTitle", { code: warranty.code })}</DialogTitle><DialogDescription>{t("detailDescription")}</DialogDescription></DialogHeader>
        <div className="grid gap-6">
          <section className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">{t("requestInfo")}</h3><Badge variant={warrantyStatusVariant(warranty.status)}>{statusLabel(t, warranty.status)}</Badge></div><div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3"><DetailField label={t("code")}><p className="font-mono font-medium">{warranty.code}</p></DetailField><DetailField label={t("createdAt")}><p>{formatDate(warranty.createdAt, locale)}</p></DetailField><DetailField label={t("updatedAt")}><p>{formatDate(warranty.updatedAt, locale)}</p></DetailField><div className="space-y-1 sm:col-span-2 lg:col-span-3"><p className="text-xs font-medium text-muted-foreground">{t("condition")}</p><p className="whitespace-pre-wrap rounded-xl bg-muted p-3 text-sm">{warranty.productCondition}</p></div></div><div className="space-y-2"><p className="text-sm font-medium">{t("attachments")}</p>{warranty.medias.length ? <div className="flex flex-wrap gap-3">{warranty.medias.map((media, index) => <WarrantyMediaItem key={media.id} media={media} index={index} />)}</div> : <p className="text-sm text-muted-foreground">{t("noAttachments")}</p>}</div></section>

          <section className="space-y-3"><h3 className="font-semibold">{t("customerReturn")}</h3><div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2"><DetailField label={t("fullName")}><p>{warranty.fullName || customer?.fullName || t("customerFallback", { id: warranty.userId })}</p></DetailField><DetailField label={t("phoneNumber")}><p>{warranty.phoneNumber || customer?.phoneNumber || "—"}</p></DetailField><DetailField label={t("email")}><p>{warranty.user?.email || "—"}</p></DetailField><DetailField label={t("account")}><p>{warranty.user?.username ? `@${warranty.user.username}` : "—"}</p></DetailField><div className="space-y-1 sm:col-span-2"><p className="text-xs font-medium text-muted-foreground">{t("returnAddress")}</p><p className="whitespace-pre-wrap rounded-xl bg-muted p-3 text-sm">{warranty.address}</p></div></div></section>

          <section className="space-y-3"><h3 className="font-semibold">{t("orderProduct")}</h3><div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-4"><DetailField label={t("order")}><p className="font-mono">#{warranty.order?.trackingNumber || warranty.orderId}</p></DetailField><DetailField label={t("orderDate")}><p>{formatDate(warranty.order?.createdAt, locale)}</p></DetailField><DetailField label={t("product")}><p className="font-medium">{warranty.orderDetail?.productName || t("productFallback", { id: warranty.productId })}</p></DetailField><DetailField label={t("purchased")}><p>{warranty.orderDetail?.quantity ?? "—"}</p></DetailField></div></section>

          {canProcess ? <section className="space-y-4 rounded-xl border bg-muted/20 p-4"><div><h3 className="font-semibold">{t("processRequest")}</h3><p className="mt-1 text-sm text-muted-foreground">{t("processDescription")}</p></div><RadioGroup value={String(decision)} onValueChange={(value) => setDecision(Number(value) as WarrantyStatus)} className="grid gap-3 sm:grid-cols-2">{decisions.map((status) => <label key={status} className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-background p-4 ${status === WarrantyStatus.Rejected ? "has-checked:border-destructive has-checked:bg-destructive/5" : "has-checked:border-primary has-checked:bg-primary/5"}`}><RadioGroupItem value={String(status)} id={`warranty-${status}-${warranty.id}`} /><span><span className="block font-medium">{decisionLabel(t, status)}</span><span className="text-sm text-muted-foreground">{decisionDescription(t, status)}</span></span></label>)}</RadioGroup><div className="space-y-2"><label htmlFor={`warranty-response-${warranty.id}`} className="text-sm font-medium">{t("response")}</label><Textarea id={`warranty-response-${warranty.id}`} value={response} onChange={(event) => setResponse(event.target.value)} maxLength={500} placeholder={decision === WarrantyStatus.Rejected ? t("rejectPlaceholder") : t("responsePlaceholder")} className="min-h-28" disabled={isSubmitting} /><p className="text-right text-xs text-muted-foreground">{response.length}/500</p></div></section> : <section className="space-y-3 rounded-xl border bg-muted/20 p-4"><h3 className="font-semibold">{t("sentResponse")}</h3><p className="whitespace-pre-wrap text-sm">{warranty.response || "—"}</p></section>}
        </div>
        <DialogFooter><Button variant="outline" disabled={isSubmitting} onClick={() => handleDetailOpenChange(false)}>{t("close")}</Button>{canProcess && <Button onClick={() => void handleDecision()} disabled={isSubmitting}>{isSubmitting && <Loader2 className="size-4 animate-spin" />}{decision === WarrantyStatus.Rejected ? <X className="size-4" /> : <Check className="size-4" />}{decisionLabel(t, decision)}</Button>}</DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}

function SortableHeader({ column, labelKey }: { column: { toggleSorting: (desc: boolean) => void; getIsSorted: () => false | "asc" | "desc" }; labelKey: "request" | "product" | "customer" | "status" | "createdAt" }) {
  const t = useTranslations("WarrantyAdmin");
  return <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>{t(labelKey)}<ArrowUpDown className="ml-1 size-3" /></Button>;
}

function RequestCell({ warranty }: { warranty: Warranty }) {
  const t = useTranslations("WarrantyAdmin");
  return <div className="min-w-44"><p className="font-mono font-medium">{warranty.code}</p><p className="text-xs text-muted-foreground">{t("order", { value: warranty.order?.trackingNumber || warranty.orderId })}</p></div>;
}

function ProductCell({ warranty }: { warranty: Warranty }) {
  const t = useTranslations("WarrantyAdmin");
  return <div className="min-w-48"><p className="line-clamp-2 font-medium">{warranty.orderDetail?.productName || t("productFallback", { id: warranty.productId })}</p><p className="text-xs text-muted-foreground">{warranty.orderDetail?.warrantyPeriod ? t("warrantyMonths", { count: warranty.orderDetail.warrantyPeriod }) : "—"}</p></div>;
}

function CustomerCell({ warranty }: { warranty: Warranty }) {
  const t = useTranslations("WarrantyAdmin");
  return <div className="min-w-44"><p className="font-medium">{warranty.fullName || t("customerFallback", { id: warranty.userId })}</p><p className="text-xs text-muted-foreground">{warranty.phoneNumber || "—"}</p></div>;
}

function StatusCell({ status }: { status: WarrantyStatus }) {
  const t = useTranslations("WarrantyAdmin");
  return <Badge variant={warrantyStatusVariant(status)}>{statusLabel(t, status)}</Badge>;
}

function CreatedAtCell({ value }: { value: string }) {
  const locale = useLocale();
  return <span className="whitespace-nowrap text-sm">{formatDate(value, locale)}</span>;
}

function ActionHeader() {
  const t = useTranslations("WarrantyAdmin");
  return <span className="flex justify-end">{t("actions")}</span>;
}

function createColumns(onUpdated: () => void): ColumnDef<Features, Warranty>[] {
  return [
    { id: "code", accessorFn: (warranty) => `${warranty.code} ${warranty.order?.trackingNumber ?? ""} ${warranty.orderId}`, header: ({ column }) => <SortableHeader column={column} labelKey="request" />, cell: ({ row }: { row: Row<Features, Warranty> }) => <RequestCell warranty={row.original} /> },
    { id: "product", accessorFn: (warranty) => warranty.orderDetail?.productName ?? "", header: ({ column }) => <SortableHeader column={column} labelKey="product" />, cell: ({ row }: { row: Row<Features, Warranty> }) => <ProductCell warranty={row.original} /> },
    { id: "customer", accessorFn: (warranty) => `${warranty.fullName} ${warranty.phoneNumber} ${warranty.user?.email ?? ""}`, header: ({ column }) => <SortableHeader column={column} labelKey="customer" />, cell: ({ row }: { row: Row<Features, Warranty> }) => <CustomerCell warranty={row.original} /> },
    { id: "status", accessorFn: (warranty) => warranty.status, header: ({ column }) => <SortableHeader column={column} labelKey="status" />, cell: ({ row }: { row: Row<Features, Warranty> }) => <StatusCell status={row.original.status} /> },
    { id: "createdAt", accessorFn: (warranty) => warranty.createdAt, header: ({ column }) => <SortableHeader column={column} labelKey="createdAt" />, cell: ({ row }: { row: Row<Features, Warranty> }) => <CreatedAtCell value={row.original.createdAt} /> },
    { id: "actions", header: () => <ActionHeader />, cell: ({ row }: { row: Row<Features, Warranty> }) => <WarrantyActionCell warranty={row.original} onUpdated={onUpdated} /> },
  ];
}

export default function WarrantyTable({ warranties, onUpdated }: { warranties: Warranty[]; onUpdated: () => void }) {
  const t = useTranslations("WarrantyAdmin");
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const columns = useMemo(() => createColumns(onUpdated), [onUpdated]);
  const filteredWarranties = useMemo(() => warranties.filter((warranty) => statusFilter === ALL || warranty.status === Number(statusFilter)), [warranties, statusFilter]);
  const table = useTable({ features, data: filteredWarranties, columns, autoResetPageIndex: false, state: { globalFilter, sorting, pagination }, onGlobalFilterChange: (value) => { setGlobalFilter(value); setPagination((current) => ({ ...current, pageIndex: 0 })); }, onSortingChange: setSorting, onPaginationChange: setPagination });

  function resetToFirstPage() { setPagination((current) => ({ ...current, pageIndex: 0 })); }

  return <div className="flex flex-col gap-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={globalFilter} onChange={(event) => { setGlobalFilter(event.target.value); resetToFirstPage(); }} className="pl-9" placeholder={t("searchPlaceholder")} /></div><Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value || ALL); resetToFirstPage(); }}><SelectTrigger className="w-full lg:w-44"><SelectValue>{statusFilter === ALL ? t("allStatuses") : statusLabel(t, Number(statusFilter) as WarrantyStatus)}</SelectValue></SelectTrigger><SelectContent><SelectItem value={ALL}>{t("allStatuses")}</SelectItem>{Object.values(WarrantyStatus).filter((value): value is WarrantyStatus => typeof value === "number").map((status) => <SelectItem key={status} value={String(status)}>{statusLabel(t, status)}</SelectItem>)}</SelectContent></Select><p className="text-sm text-muted-foreground lg:ml-auto">{t("requestCount", { count: filteredWarranties.length })}</p></div><div className="overflow-x-auto rounded-2xl border bg-card"><Table><TableHeader>{table.getHeaderGroups().map((headerGroup: HeaderGroup<Features, Warranty>) => <TableRow key={headerGroup.id}>{headerGroup.headers.map((header: Header<Features, Warranty, unknown>) => <TableHead key={header.id} className={header.id === "actions" ? "text-right" : ""}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.length ? table.getRowModel().rows.map((row: Row<Features, Warranty>) => <TableRow key={row.id}>{row.getVisibleCells().map((cell: Cell<Features, Warranty, unknown>) => <TableCell key={cell.id} className={cell.column.id === "actions" ? "text-right" : ""}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">{t("noResults")}</TableCell></TableRow>}</TableBody></Table></div><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">{t("page", { current: table.state.pagination.pageIndex + 1, total: table.getPageCount() || 1 })}</p><div className="flex items-center gap-2"><Select value={String(table.state.pagination.pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}><SelectTrigger className="h-9 w-18 text-xs"><SelectValue /></SelectTrigger><SelectContent>{[10, 20, 30, 40, 50].map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent></Select><Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>{t("previous")}</Button><Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>{t("next")}</Button></div></div></div>;
}
