"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Eye, MoreHorizontal, Search } from "lucide-react";
import type { Cell, ColumnDef, Header, HeaderGroup, Row, SortingState } from "@tanstack/react-table";
import {
  columnFilteringFeature, columnVisibilityFeature, coreFeatures, createFilteredRowModel,
  createPaginatedRowModel, createSortedRowModel, flexRender, globalFilteringFeature,
  rowPaginationFeature, rowSortingFeature, tableFeatures, useTable,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  OrderStatusLabels, PaymentMethod, PaymentMethodLabels, PaymentStatus, PaymentStatusLabels,
} from "@/types/model.types";
import type { Payment } from "@/types/model.types";

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
const ALL = "all";

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value ?? 0);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
}

function paymentStatusVariant(status: PaymentStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case PaymentStatus.Success: return "default";
    case PaymentStatus.Failed:
    case PaymentStatus.Expired: return "destructive";
    case PaymentStatus.Refunded: return "outline";
    default: return "secondary";
  }
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground">{label}</p><div>{children}</div></div>;
}

function PaymentActionCell({ payment }: { payment: Payment }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const order = payment.order;
  const orderStatus = order == null ? null : OrderStatusLabels[order.status];

  return <>
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Thao tác thanh toán" />}>
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setDetailOpen(true)}><Eye />Xem chi tiết</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Chi tiết giao dịch #{payment.id}</DialogTitle>
          <DialogDescription>Thông tin thanh toán, khách hàng và đơn hàng liên quan.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Thanh toán</h3><Badge variant={paymentStatusVariant(payment.status)}>{PaymentStatusLabels[payment.status]}</Badge></div>
            <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailField label="Mã giao dịch"><p className="font-mono text-sm">{payment.transactionId || `PAY-${payment.id}`}</p></DetailField>
              <DetailField label="Phương thức"><p>{PaymentMethodLabels[payment.paymentMethod]}</p></DetailField>
              <DetailField label="Số tiền"><p className="font-semibold">{formatCurrency(payment.amount)}</p></DetailField>
              <DetailField label="Tạo lúc"><p>{formatDate(payment.createdAt)}</p></DetailField>
              <DetailField label="Thanh toán lúc"><p>{formatDate(payment.paidAt)}</p></DetailField>
              <DetailField label="Hết hạn lúc"><p>{formatDate(payment.expiresAt)}</p></DetailField>
            </div>
            {(payment.bankId || payment.accountNumber || payment.transferDescription) && <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-3">
              <DetailField label="Ngân hàng"><p>{payment.bankId || "—"}</p></DetailField>
              <DetailField label="Số tài khoản"><p className="font-mono">{payment.accountNumber || "—"}</p></DetailField>
              <DetailField label="Nội dung chuyển khoản"><p className="font-mono">{payment.transferDescription || "—"}</p></DetailField>
            </div>}
            {payment.gatewayResponse && <DetailField label="Phản hồi cổng thanh toán"><p className="max-h-40 overflow-y-auto whitespace-pre-wrap break-all rounded-xl bg-muted p-3 font-mono text-xs">{payment.gatewayResponse}</p></DetailField>}
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold">Khách hàng</h3>
            <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailField label="Họ tên"><p>{order?.customerName || `Khách hàng #${order?.userId ?? payment.orderUserId}`}</p></DetailField>
              <DetailField label="Số điện thoại"><p>{order?.customerPhone || "—"}</p></DetailField>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Đơn hàng liên quan</h3>{orderStatus && <Badge variant="outline">{orderStatus}</Badge>}</div>
            <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-4">
              <DetailField label="Mã đơn"><p className="font-mono">#{order?.trackingNumber || payment.orderId}</p></DetailField>
              <DetailField label="Tạo lúc"><p>{formatDate(order?.createdAt)}</p></DetailField>
              <DetailField label="Tạm tính"><p>{formatCurrency(order?.subtotalPrice)}</p></DetailField>
              <DetailField label="Phí giao hàng"><p>{formatCurrency(order?.shippingFee)}</p></DetailField>
              <DetailField label="Giảm giá"><p>{formatCurrency(order?.discountAmount)}</p></DetailField>
              <DetailField label="Tổng đơn hàng"><p className="font-semibold">{formatCurrency(order?.totalPrice)}</p></DetailField>
              <div className="space-y-1 sm:col-span-2"><p className="text-xs font-medium text-muted-foreground">Địa chỉ giao hàng</p><p>{order?.address || "—"}</p></div>
            </div>
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader><TableRow><TableHead>Sản phẩm</TableHead><TableHead className="text-right">Đơn giá</TableHead><TableHead className="text-right">SL</TableHead><TableHead className="text-right">Thành tiền</TableHead></TableRow></TableHeader>
                <TableBody>{(order?.orderDetails ?? []).length ? order?.orderDetails.map((item) => <TableRow key={`${item.orderId}-${item.productId}`}><TableCell><p className="font-medium">{item.productName}</p><p className="font-mono text-xs text-muted-foreground">#{item.productId}</p></TableCell><TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell><TableCell className="text-right">{item.quantity}</TableCell><TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell></TableRow>) : <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground">Không có sản phẩm trong đơn hàng.</TableCell></TableRow>}</TableBody>
              </Table>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}

function sortableHeader(label: string) {
  return ({ column }: { column: { toggleSorting: (desc: boolean) => void; getIsSorted: () => false | "asc" | "desc" } }) => <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>{label}<ArrowUpDown className="ml-1 size-3" /></Button>;
}

function createColumns(): ColumnDef<Features, Payment>[] {
  return [
    { id: "transaction", accessorFn: (payment) => `${payment.id} ${payment.transactionId ?? ""}`, header: sortableHeader("Giao dịch"), cell: ({ row }: { row: Row<Features, Payment> }) => <div className="min-w-44"><p className="font-medium">#{row.original.transactionId || `PAY-${row.original.id}`}</p><p className="text-xs text-muted-foreground">Mã thanh toán: {row.original.id}</p></div> },
    { id: "order", accessorFn: (payment) => `${payment.order?.trackingNumber ?? ""} ${payment.orderId}`, header: sortableHeader("Đơn hàng"), cell: ({ row }: { row: Row<Features, Payment> }) => <div><p className="font-medium">#{row.original.order?.trackingNumber || row.original.orderId}</p><p className="text-xs text-muted-foreground">Đơn hàng: {row.original.orderId}</p></div> },
    { id: "customer", accessorFn: (payment) => `${payment.order?.customerName ?? ""} ${payment.order?.customerPhone ?? ""}`, header: sortableHeader("Khách hàng"), cell: ({ row }: { row: Row<Features, Payment> }) => <div className="min-w-48"><p className="font-medium">{row.original.order?.customerName || `Khách hàng #${row.original.order?.userId ?? row.original.orderUserId}`}</p><p className="truncate text-xs text-muted-foreground">{row.original.order?.customerPhone || "—"}</p></div> },
    { id: "method", accessorFn: (payment) => payment.paymentMethod, header: sortableHeader("Phương thức"), cell: ({ row }: { row: Row<Features, Payment> }) => <span>{PaymentMethodLabels[row.original.paymentMethod]}</span> },
    { id: "amount", accessorFn: (payment) => payment.amount, header: sortableHeader("Số tiền"), cell: ({ row }: { row: Row<Features, Payment> }) => <span className="font-semibold">{formatCurrency(row.original.amount)}</span> },
    { id: "status", accessorFn: (payment) => payment.status, header: sortableHeader("Trạng thái"), cell: ({ row }: { row: Row<Features, Payment> }) => <Badge variant={paymentStatusVariant(row.original.status)}>{PaymentStatusLabels[row.original.status]}</Badge> },
    { id: "createdAt", accessorFn: (payment) => payment.createdAt, header: sortableHeader("Thời gian"), cell: ({ row }: { row: Row<Features, Payment> }) => <div className="min-w-40"><p>{formatDate(row.original.createdAt)}</p>{row.original.paidAt && <p className="text-xs text-muted-foreground">TT: {formatDate(row.original.paidAt)}</p>}</div> },
    { id: "actions", header: () => <span className="flex justify-end">Thao tác</span>, cell: ({ row }: { row: Row<Features, Payment> }) => <PaymentActionCell payment={row.original} /> },
  ];
}

export default function PaymentTable({ payments }: { payments: Payment[] }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const columns = useMemo(() => createColumns(), []);
  const filteredPayments = useMemo(() => payments.filter((payment) => (methodFilter === ALL || payment.paymentMethod === Number(methodFilter)) && (statusFilter === ALL || payment.status === Number(statusFilter))), [payments, methodFilter, statusFilter]);

  const table = useTable({
    features,
    data: filteredPayments,
    columns,
    autoResetPageIndex: false,
    state: { globalFilter, sorting, pagination },
    onGlobalFilterChange: (value) => { setGlobalFilter(value); setPagination((current) => ({ ...current, pageIndex: 0 })); },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  });

  function resetToFirstPage() { setPagination((current) => ({ ...current, pageIndex: 0 })); }

  return <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative w-full max-w-sm"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={globalFilter} onChange={(event) => { setGlobalFilter(event.target.value); resetToFirstPage(); }} className="pl-9" placeholder="Tìm mã giao dịch, đơn hàng, khách hàng..." /></div>
      <Select value={methodFilter} onValueChange={(value) => { setMethodFilter(value || ALL); resetToFirstPage(); }}><SelectTrigger className="w-full lg:w-52"><SelectValue>{methodFilter === ALL ? "Tất cả phương thức" : PaymentMethodLabels[Number(methodFilter) as PaymentMethod]}</SelectValue></SelectTrigger><SelectContent><SelectItem value={ALL}>Tất cả phương thức</SelectItem>{Object.values(PaymentMethod).filter((value): value is PaymentMethod => typeof value === "number").map((method) => <SelectItem key={method} value={String(method)}>{PaymentMethodLabels[method]}</SelectItem>)}</SelectContent></Select>
      <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value || ALL); resetToFirstPage(); }}><SelectTrigger className="w-full lg:w-44"><SelectValue>{statusFilter === ALL ? "Tất cả trạng thái" : PaymentStatusLabels[Number(statusFilter) as PaymentStatus]}</SelectValue></SelectTrigger><SelectContent><SelectItem value={ALL}>Tất cả trạng thái</SelectItem>{Object.values(PaymentStatus).filter((value): value is PaymentStatus => typeof value === "number").map((status) => <SelectItem key={status} value={String(status)}>{PaymentStatusLabels[status]}</SelectItem>)}</SelectContent></Select>
      <p className="text-sm text-muted-foreground lg:ml-auto">{filteredPayments.length} giao dịch</p>
    </div>

    <div className="rounded-2xl border bg-card"><Table><TableHeader>{table.getHeaderGroups().map((headerGroup: HeaderGroup<Features, Payment>) => <TableRow key={headerGroup.id}>{headerGroup.headers.map((header: Header<Features, Payment, unknown>) => <TableHead key={header.id} className={header.id === "actions" ? "text-right" : ""}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.length ? table.getRowModel().rows.map((row: Row<Features, Payment>) => <TableRow key={row.id}>{row.getVisibleCells().map((cell: Cell<Features, Payment, unknown>) => <TableCell key={cell.id} className={cell.column.id === "actions" ? "text-right" : ""}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">Không tìm thấy giao dịch thanh toán phù hợp.</TableCell></TableRow>}</TableBody></Table></div>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">Trang {table.state.pagination.pageIndex + 1} / {table.getPageCount() || 1}</p><div className="flex items-center gap-2"><Select value={String(table.state.pagination.pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}><SelectTrigger className="h-9 w-18 text-xs"><SelectValue /></SelectTrigger><SelectContent>{[10, 20, 30, 40, 50].map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent></Select><Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Trước</Button><Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Sau</Button></div></div>
  </div>;
}
