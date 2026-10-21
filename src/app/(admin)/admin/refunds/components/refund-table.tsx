"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowUpDown, Check, Eye, Loader2, MoreHorizontal, Search, X } from "lucide-react";
import type { Cell, ColumnDef, Header, HeaderGroup, Row, SortingState } from "@tanstack/react-table";
import {
  columnFilteringFeature, columnVisibilityFeature, coreFeatures, createFilteredRowModel,
  createPaginatedRowModel, createSortedRowModel, flexRender, globalFilteringFeature,
  rowPaginationFeature, rowSortingFeature, tableFeatures, useTable,
} from "@tanstack/react-table";
import { approveRefund } from "@/actions/refund.action";
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
import { MediaType, OrderStatusLabels, RefundStatus, RefundStatusLabels } from "@/types/model.types";
import type { Refund, ReviewMedia } from "@/types/model.types";

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

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value ?? 0);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
}

function refundStatusVariant(status: RefundStatus): "default" | "secondary" | "destructive" {
  if (status === RefundStatus.Approved) return "default";
  if (status === RefundStatus.Rejected) return "destructive";
  return "secondary";
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground">{label}</p><div>{children}</div></div>;
}

function RefundMediaItem({ media, index }: { media: ReviewMedia; index: number }) {
  const label = `Tệp đính kèm ${index + 1}`;
  if (media.mediaType === MediaType.Video) return <video src={media.mediaUrl} controls preload="metadata" aria-label={label} className="h-28 w-44 rounded-lg border bg-muted object-cover" />;
  return <a href={media.mediaUrl} target="_blank" rel="noreferrer" aria-label={label} className="group relative block size-28 overflow-hidden rounded-lg border bg-muted"><Image src={media.mediaUrl} alt={label} fill className="object-cover transition-transform group-hover:scale-105" unoptimized /></a>;
}

function RefundActionCell({ refund, onUpdated }: { refund: Refund; onUpdated: () => void }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [decision, setDecision] = useState<RefundStatus.Approved | RefundStatus.Rejected>(RefundStatus.Approved);
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isPending = refund.status === RefundStatus.Pending;
  const order = refund.order;
  const customer = refund.user?.profile;

  function handleDetailOpenChange(nextOpen: boolean) {
    if (isSubmitting) return;
    setDetailOpen(nextOpen);
    if (nextOpen) {
      setDecision(RefundStatus.Approved);
      setResponse(refund.response || "");
    }
  }

  async function handleDecision() {
    if (!response.trim()) {
      toast.add({ title: "Vui lòng nhập phản hồi cho khách hàng.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await approveRefund(refund.orderId, refund.productId, { status: decision, response: response.trim() });
      if (!result.success) {
        toast.add({ title: result.message || "Không thể cập nhật yêu cầu hoàn tiền.", type: "error" });
        return;
      }
      toast.add({ title: decision === RefundStatus.Approved ? "Đã duyệt yêu cầu hoàn tiền." : "Đã từ chối yêu cầu hoàn tiền.", type: "success" });
      setDetailOpen(false);
      onUpdated();
    } finally {
      setIsSubmitting(false);
    }
  }

  return <>
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Thao tác hoàn tiền" />}><MoreHorizontal /></DropdownMenuTrigger>
      <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleDetailOpenChange(true)}><Eye />Xem chi tiết</DropdownMenuItem></DropdownMenuContent>
    </DropdownMenu>

    <Dialog open={detailOpen} onOpenChange={handleDetailOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto sm:max-w-4xl">
        <DialogHeader><DialogTitle>Yêu cầu hoàn tiền #{refund.orderId}-{refund.productId}</DialogTitle><DialogDescription>Kiểm tra thông tin, bằng chứng và phản hồi cho khách hàng.</DialogDescription></DialogHeader>

        <div className="grid gap-6">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Thông tin yêu cầu</h3><Badge variant={refundStatusVariant(refund.status)}>{RefundStatusLabels[refund.status]}</Badge></div>
            <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailField label="Tạo lúc"><p>{formatDate(refund.createdAt)}</p></DetailField>
              <DetailField label="Số lượng yêu cầu"><p>{refund.quantity}</p></DetailField>
              <DetailField label="Số tiền hoàn"><p className="font-semibold">{formatCurrency(refund.amount)}</p></DetailField>
              <div className="space-y-1 sm:col-span-2 lg:col-span-3"><p className="text-xs font-medium text-muted-foreground">Lý do từ khách hàng</p><p className="whitespace-pre-wrap rounded-xl bg-muted p-3 text-sm">{refund.reason}</p></div>
            </div>
            <div className="space-y-2"><p className="text-sm font-medium">Ảnh/video đính kèm</p>{refund.medias.length ? <div className="flex flex-wrap gap-3">{refund.medias.map((media, index) => <RefundMediaItem key={media.id} media={media} index={index} />)}</div> : <p className="text-sm text-muted-foreground">Khách hàng không đính kèm tệp.</p>}</div>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold">Khách hàng</h3>
            <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailField label="Họ tên"><p>{customer?.fullName || order?.customerName || `Khách hàng #${refund.userId}`}</p></DetailField>
              <DetailField label="Số điện thoại"><p>{customer?.phoneNumber || order?.customerPhone || "—"}</p></DetailField>
              <DetailField label="Email"><p>{refund.user?.email || "—"}</p></DetailField>
              <DetailField label="Tài khoản"><p>{refund.user?.username ? `@${refund.user.username}` : "—"}</p></DetailField>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Đơn hàng và sản phẩm</h3>{order && <Badge variant="outline">{OrderStatusLabels[order.status]}</Badge>}</div>
            <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-4">
              <DetailField label="Mã đơn"><p className="font-mono">#{order?.trackingNumber || refund.orderId}</p></DetailField>
              <DetailField label="Tạo đơn"><p>{formatDate(order?.createdAt)}</p></DetailField>
              <DetailField label="Tổng đơn hàng"><p className="font-semibold">{formatCurrency(order?.totalPrice)}</p></DetailField>
              <DetailField label="Địa chỉ giao"><p>{order?.address || "—"}</p></DetailField>
              <DetailField label="Sản phẩm"><p className="font-medium">{refund.orderDetail?.productName || `Sản phẩm #${refund.productId}`}</p></DetailField>
              <DetailField label="Đơn giá"><p>{formatCurrency(refund.orderDetail?.unitPrice)}</p></DetailField>
              <DetailField label="Đã mua"><p>{refund.orderDetail?.quantity ?? "—"}</p></DetailField>
              <DetailField label="Thành tiền sản phẩm"><p>{formatCurrency(refund.orderDetail?.totalPrice)}</p></DetailField>
            </div>
          </section>

          {isPending ? <section className="space-y-4 rounded-xl border bg-muted/20 p-4">
            <div><h3 className="font-semibold">Xử lý yêu cầu</h3><p className="mt-1 text-sm text-muted-foreground">Chọn kết quả và nhập phản hồi sẽ gửi đến khách hàng.</p></div>
            <RadioGroup value={String(decision)} onValueChange={(value) => setDecision(Number(value) as RefundStatus.Approved | RefundStatus.Rejected)} className="grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border bg-background p-4 has-checked:border-primary has-checked:bg-primary/5"><RadioGroupItem value={String(RefundStatus.Approved)} id={`refund-approve-${refund.orderId}-${refund.productId}`} /><span><span className="block font-medium">Duyệt hoàn tiền</span><span className="text-sm text-muted-foreground">Xác nhận hoàn lại số tiền đã yêu cầu.</span></span></label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border bg-background p-4 has-checked:border-destructive has-checked:bg-destructive/5"><RadioGroupItem value={String(RefundStatus.Rejected)} id={`refund-reject-${refund.orderId}-${refund.productId}`} /><span><span className="block font-medium">Không duyệt</span><span className="text-sm text-muted-foreground">Từ chối và nêu rõ lý do cho khách hàng.</span></span></label>
            </RadioGroup>
            <div className="space-y-2"><label htmlFor={`refund-response-${refund.orderId}-${refund.productId}`} className="text-sm font-medium">Phản hồi cho khách hàng</label><Textarea id={`refund-response-${refund.orderId}-${refund.productId}`} value={response} onChange={(event) => setResponse(event.target.value)} maxLength={500} placeholder={decision === RefundStatus.Approved ? "Ví dụ: Yêu cầu đã được duyệt, chúng tôi sẽ hoàn tiền theo phương thức thanh toán." : "Nêu rõ lý do không thể duyệt yêu cầu."} className="min-h-28" disabled={isSubmitting} /><p className="text-right text-xs text-muted-foreground">{response.length}/500</p></div>
          </section> : <section className="space-y-3 rounded-xl border bg-muted/20 p-4"><h3 className="font-semibold">Phản hồi đã gửi</h3><p className="whitespace-pre-wrap text-sm">{refund.response || "—"}</p>{refund.approvedByUser && <p className="text-xs text-muted-foreground">Xử lý bởi {refund.approvedByUser.profile?.fullName || refund.approvedByUser.username || `người dùng #${refund.approvedByUserId}`} · {formatDate(refund.updatedAt)}</p>}</section>}
        </div>

        <DialogFooter><Button variant="outline" disabled={isSubmitting} onClick={() => handleDetailOpenChange(false)}>Đóng</Button>{isPending && <Button onClick={() => void handleDecision()} disabled={isSubmitting}>{isSubmitting && <Loader2 className="size-4 animate-spin" />}{decision === RefundStatus.Approved ? <Check className="size-4" /> : <X className="size-4" />}{decision === RefundStatus.Approved ? "Xác nhận duyệt" : "Xác nhận từ chối"}</Button>}</DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}

function sortableHeader(label: string) {
  function SortableHeader({ column }: { column: { toggleSorting: (desc: boolean) => void; getIsSorted: () => false | "asc" | "desc" } }) {
    return <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>{label}<ArrowUpDown className="ml-1 size-3" /></Button>;
  }

  SortableHeader.displayName = `SortableHeader${label}`;
  return SortableHeader;
}

function createColumns(onUpdated: () => void): ColumnDef<Features, Refund>[] {
  return [
    { id: "request", accessorFn: (refund) => `${refund.order?.trackingNumber ?? ""} ${refund.orderId} ${refund.productId} ${refund.orderDetail?.productName ?? ""}`, header: sortableHeader("Yêu cầu"), cell: ({ row }: { row: Row<Features, Refund> }) => <div className="min-w-52"><p className="font-medium">#{row.original.order?.trackingNumber || row.original.orderId}</p><p className="line-clamp-1 text-xs text-muted-foreground">{row.original.orderDetail?.productName || `Sản phẩm #${row.original.productId}`}</p></div> },
    { id: "customer", accessorFn: (refund) => `${refund.user?.profile?.fullName ?? refund.order?.customerName ?? ""} ${refund.user?.profile?.phoneNumber ?? refund.order?.customerPhone ?? ""}`, header: sortableHeader("Khách hàng"), cell: ({ row }: { row: Row<Features, Refund> }) => <div className="min-w-44"><p className="font-medium">{row.original.user?.profile?.fullName || row.original.order?.customerName || `Khách hàng #${row.original.userId}`}</p><p className="text-xs text-muted-foreground">{row.original.user?.profile?.phoneNumber || row.original.order?.customerPhone || "—"}</p></div> },
    { id: "quantity", accessorFn: (refund) => refund.quantity, header: sortableHeader("Số lượng"), cell: ({ row }: { row: Row<Features, Refund> }) => <span>{row.original.quantity}</span> },
    { id: "amount", accessorFn: (refund) => refund.amount, header: sortableHeader("Số tiền"), cell: ({ row }: { row: Row<Features, Refund> }) => <span className="whitespace-nowrap font-semibold">{formatCurrency(row.original.amount)}</span> },
    { id: "status", accessorFn: (refund) => refund.status, header: sortableHeader("Trạng thái"), cell: ({ row }: { row: Row<Features, Refund> }) => <Badge variant={refundStatusVariant(row.original.status)}>{RefundStatusLabels[row.original.status]}</Badge> },
    { id: "createdAt", accessorFn: (refund) => refund.createdAt, header: sortableHeader("Ngày tạo"), cell: ({ row }: { row: Row<Features, Refund> }) => <span className="whitespace-nowrap text-sm">{formatDate(row.original.createdAt)}</span> },
    { id: "actions", header: () => <span className="flex justify-end">Thao tác</span>, cell: ({ row }: { row: Row<Features, Refund> }) => <RefundActionCell refund={row.original} onUpdated={onUpdated} /> },
  ];
}

export default function RefundTable({ refunds, onUpdated }: { refunds: Refund[]; onUpdated: () => void }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const columns = useMemo(() => createColumns(onUpdated), [onUpdated]);
  const filteredRefunds = useMemo(() => refunds.filter((refund) => statusFilter === ALL || refund.status === Number(statusFilter)), [refunds, statusFilter]);
  const table = useTable({ features, data: filteredRefunds, columns, autoResetPageIndex: false, state: { globalFilter, sorting, pagination }, onGlobalFilterChange: (value) => { setGlobalFilter(value); setPagination((current) => ({ ...current, pageIndex: 0 })); }, onSortingChange: setSorting, onPaginationChange: setPagination });

  function resetToFirstPage() { setPagination((current) => ({ ...current, pageIndex: 0 })); }

  return <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={globalFilter} onChange={(event) => { setGlobalFilter(event.target.value); resetToFirstPage(); }} className="pl-9" placeholder="Tìm mã đơn, sản phẩm, khách hàng..." /></div>
      <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value || ALL); resetToFirstPage(); }}><SelectTrigger className="w-full lg:w-44"><SelectValue>{statusFilter === ALL ? "Tất cả trạng thái" : RefundStatusLabels[Number(statusFilter) as RefundStatus]}</SelectValue></SelectTrigger><SelectContent><SelectItem value={ALL}>Tất cả trạng thái</SelectItem>{Object.values(RefundStatus).filter((value): value is RefundStatus => typeof value === "number").map((status) => <SelectItem key={status} value={String(status)}>{RefundStatusLabels[status]}</SelectItem>)}</SelectContent></Select>
      <p className="text-sm text-muted-foreground lg:ml-auto">{filteredRefunds.length} yêu cầu</p>
    </div>

    <div className="overflow-x-auto rounded-2xl border bg-card"><Table><TableHeader>{table.getHeaderGroups().map((headerGroup: HeaderGroup<Features, Refund>) => <TableRow key={headerGroup.id}>{headerGroup.headers.map((header: Header<Features, Refund, unknown>) => <TableHead key={header.id} className={header.id === "actions" ? "text-right" : ""}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.length ? table.getRowModel().rows.map((row: Row<Features, Refund>) => <TableRow key={row.id}>{row.getVisibleCells().map((cell: Cell<Features, Refund, unknown>) => <TableCell key={cell.id} className={cell.column.id === "actions" ? "text-right" : ""}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">Không tìm thấy yêu cầu hoàn tiền phù hợp.</TableCell></TableRow>}</TableBody></Table></div>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">Trang {table.state.pagination.pageIndex + 1} / {table.getPageCount() || 1}</p><div className="flex items-center gap-2"><Select value={String(table.state.pagination.pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}><SelectTrigger className="h-9 w-18 text-xs"><SelectValue /></SelectTrigger><SelectContent>{[10, 20, 30, 40, 50].map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent></Select><Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Trước</Button><Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Sau</Button></div></div>
  </div>;
}
