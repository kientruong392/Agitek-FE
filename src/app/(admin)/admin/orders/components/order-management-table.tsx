"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown, Check, Loader2, MapPin, PackageCheck, Plus, Search, Truck,
} from "lucide-react";
import type { ColumnDef, Header, Cell, HeaderGroup, SortingState, Row } from "@tanstack/react-table";
import {
  coreFeatures, tableFeatures, columnFilteringFeature, globalFilteringFeature,
  rowSortingFeature, rowPaginationFeature, columnVisibilityFeature,
  createSortedRowModel, createFilteredRowModel, createPaginatedRowModel,
  flexRender, useTable,
} from "@tanstack/react-table";
import { getAllWarehouses } from "@/actions/location.action";
import dynamic from "next/dynamic";
import { addOrderTrackingPoint, confirmOrder, getDeliveryUsers, getOrderTracking, shipOrder, startOrderTransit } from "@/actions/order.action";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { LocationStatus, OrderStatus, OrderStatusLabels } from "@/types/model.types";
import type { LocationDTO, Order, OrderTrackingLog } from "@/types/model.types";

const RouteMap = dynamic(() => import("./route-map"), { ssr: false, loading: () => <div className="h-80 animate-pulse rounded-xl bg-muted" /> });
const LocationMap = dynamic(() => import("../../locations/components/location-map"), { ssr: false, loading: () => <div className="h-96 animate-pulse rounded-xl bg-muted" /> });
const features = tableFeatures({
  ...coreFeatures, columnVisibilityFeature, columnFilteringFeature, globalFilteringFeature,
  rowSortingFeature, rowPaginationFeature, sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(), paginatedRowModel: createPaginatedRowModel(),
});
type Features = typeof features;
type DeliveryUser = { id: number; username: string; fullName: string };
const ALL = "all";

function price(value: number) { return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value); }
function statusColor(status: OrderStatus) {
  if ([OrderStatus.Delivered, OrderStatus.Completed, OrderStatus.Paid].includes(status)) return "default" as const;
  if ([OrderStatus.Cancelled, OrderStatus.Returned, OrderStatus.Refunded].includes(status)) return "destructive" as const;
  return "secondary" as const;
}

function OrderActionCell({ order, warehouses, onUpdated }: { order: Order; warehouses: LocationDTO[]; onUpdated: () => void }) {
  const [assignOpen, setAssignOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [checkpointOpen, setCheckpointOpen] = useState(false);
  const [deliveryUsers, setDeliveryUsers] = useState<DeliveryUser[]>([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [deliveryPosition, setDeliveryPosition] = useState<[number, number]>([
    order.toLocation?.latitude ?? 21.028511,
    order.toLocation?.longitude ?? 105.854167,
  ]);
  const [description, setDescription] = useState("");
  const [logs, setLogs] = useState<OrderTrackingLog[]>(order.orderTrackingLogs ?? []);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [deliveryResultOpen, setDeliveryResultOpen] = useState(false);

  async function openAssignment() {
    const response = await getDeliveryUsers();
    if (!response.success) { toast.add({ title: response.message || "Không thể tải danh sách nhân viên giao hàng", type: "error" }); return; }
    setDeliveryUsers(response.data ?? []);
    setSelectedDriver(""); setSelectedWarehouse(""); setAssignOpen(true);
  }

  async function openTracking() {
    setTrackingOpen(true);
    setBusy(true);
    const response = await getOrderTracking(order.id);
    setBusy(false);
    if (response.success) setLogs(response.data ?? []);
    else toast.add({ title: response.message || "Không thể tải lịch sử theo dõi đơn hàng", type: "error" });
  }

  async function handleAssignment() {
    if (!selectedDriver || !selectedWarehouse) return;
    if (!order.toLocation && !deliveryPosition.every(Number.isFinite)) return;
    setBusy(true);
    const response = await confirmOrder(order.id, {
      status: OrderStatus.Confirmed,
      deliveredByUserId: Number(selectedDriver),
      startingWarehouseId: Number(selectedWarehouse),
      startingWarehouseDescription: "Điểm xuất phát",
      ...(!order.toLocation && { createLocation: { latitude: deliveryPosition[0], longitude: deliveryPosition[1] } }),
    });
    setBusy(false);
    if (!response.success) { toast.add({ title: response.message || "Không thể phân công đơn hàng", type: "error" }); return; }
    toast.add({ title: "Đã xác nhận đơn và phân công giao hàng", type: "success" });
    setAssignOpen(false); setTrackingOpen(false); onUpdated();
  }

  async function handleCheckpoint() {
    if (!selectedWarehouse || !description.trim()) return;
    setBusy(true);
    const response = await addOrderTrackingPoint(order.id, { locationId: Number(selectedWarehouse), description: description.trim() });
    setBusy(false);
    if (!response.success) { toast.add({ title: response.message || "Không thể lưu điểm tuyến", type: "error" }); return; }
    setLogs(response.data ?? []); setDescription(""); setCheckpointOpen(false); onUpdated();
  }

  async function handleDelivery(status: OrderStatus.Delivered | OrderStatus.Returned) {
    if (order.status !== OrderStatus.InTransit) return;
    if (!proofFile) { toast.add({ title: "Cần tải lên ảnh xác nhận giao hàng", type: "error" }); return; }
    setBusy(true);
    const uploaded = await uploadImageToCloudinary(proofFile, "agitek/orders/proof");
    if (!uploaded.success || !uploaded.data) { setBusy(false); toast.add({ title: uploaded.message || "Không thể tải ảnh lên", type: "error" }); return; }
    const result = await shipOrder(order.id, { status, medias: [{ mediaUrl: uploaded.data.secure_url }] });
    setBusy(false);
    if (!result.success) { toast.add({ title: result.message || "Không thể cập nhật trạng thái giao hàng", type: "error" }); return; }
    toast.add({ title: status === OrderStatus.Delivered ? "Đã cập nhật giao hàng thành công" : "Đã cập nhật giao hàng thất bại", type: "success" }); setDeliveryResultOpen(false); setTrackingOpen(false); onUpdated();
  }

  return <>
    <Button size="sm" variant="outline" onClick={() => void openTracking()} disabled={busy}>
      <MapPin className="mr-1 size-4" />Theo dõi đơn hàng
    </Button>

    <Dialog open={trackingOpen} onOpenChange={setTrackingOpen}><DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-5xl overflow-y-auto sm:max-w-5xl">
      <DialogHeader><DialogTitle>Theo dõi đơn hàng #{order.trackingNumber}</DialogTitle><DialogDescription>Trạng thái, hành trình qua các kho và thao tác xử lý đơn.</DialogDescription></DialogHeader>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
        <div className="space-y-1"><p className="text-sm text-muted-foreground">Trạng thái hiện tại</p><Badge variant={statusColor(order.status)}>{OrderStatusLabels[order.status] ?? "Không rõ"}</Badge></div>
        <div className="flex flex-wrap justify-end gap-2">
          {[OrderStatus.Ordered, OrderStatus.Paid].includes(order.status) && <Button size="sm" onClick={() => void openAssignment()}><Check className="mr-1 size-4" />Duyệt & phân công</Button>}
          {order.status === OrderStatus.Confirmed && <Button size="sm" variant="outline" onClick={async () => { setBusy(true); const res = await startOrderTransit(order.id); setBusy(false); if (res.success) { onUpdated(); setTrackingOpen(false); } else toast.add({ title: res.message || "Không thể bắt đầu vận chuyển", type: "error" }); }} disabled={busy}>{busy ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Truck className="mr-1 size-4" />}Bắt đầu vận chuyển</Button>}
          {order.status === OrderStatus.InTransit && <Button size="sm" onClick={() => { setSelectedWarehouse(""); setCheckpointOpen(true); }}><Plus className="mr-1 size-4" />Thêm điểm kho</Button>}
          <Button size="sm" variant="outline" onClick={() => { setProofFile(null); setDeliveryResultOpen(true); }} disabled={busy || order.status !== OrderStatus.InTransit}><PackageCheck className="mr-1 size-4" />Đã giao hàng</Button>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(16rem,0.8fr)]">
        <RouteMap logs={logs} destination={order.toLocation} />
        <div className="space-y-3">
          <h3 className="font-semibold">Lịch sử hành trình</h3>
          {logs.length ? <ol className="max-h-80 space-y-0 overflow-y-auto">{logs.map((log, index) => <li key={log.id || `${log.timestamp}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">
            {index < logs.length - 1 && <span className="absolute left-3 top-7 h-[calc(100%-0.75rem)] w-px bg-border" />}
            <span className="z-10 grid size-6 shrink-0 place-items-center rounded-full border bg-background text-xs font-semibold">{index + 1}</span>
            <span className="min-w-0"><b className="block truncate">{log.locationName || "Điểm tuyến"}</b><span className="block text-sm text-muted-foreground">{log.description}</span><span className="block text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString("vi-VN")}</span></span>
          </li>)}</ol> : <p className="text-sm text-muted-foreground">Chưa có điểm tracking kho.</p>}
          {order.toLocation ? <div className="rounded-lg border border-primary/30 bg-primary/5 p-3"><p className="text-xs font-medium text-muted-foreground">ĐIỂM GIAO</p><p className="mt-1 font-semibold">{order.toLocation.locationName}</p><p className="text-xs text-muted-foreground">{order.toLocation.latitude}, {order.toLocation.longitude}</p></div> : <p className="text-sm text-muted-foreground">Đơn chưa có tọa độ điểm giao.</p>}
        </div>
      </div>
    </DialogContent></Dialog>

    <Dialog open={assignOpen} onOpenChange={setAssignOpen}><DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-5xl overflow-y-auto sm:max-w-5xl">
      <DialogHeader><DialogTitle>Duyệt và phân công đơn #{order.trackingNumber}</DialogTitle><DialogDescription>Chọn nhân viên giao hàng và kho xuất phát. Kho này sẽ là điểm đầu tiên trên tuyến.</DialogDescription></DialogHeader>
      <div className="grid gap-6 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.4fr)]">
        <div className="space-y-4">
          <div className="space-y-2"><Label>Nhân viên giao hàng</Label><Select value={selectedDriver} onValueChange={(value) => value && setSelectedDriver(value)}><SelectTrigger className="w-full"><SelectValue placeholder="Chọn nhân viên">{deliveryUsers.find((user) => String(user.id) === selectedDriver)?.fullName ?? "Chọn nhân viên"}</SelectValue></SelectTrigger><SelectContent>{deliveryUsers.map((user) => <SelectItem key={user.id} value={String(user.id)}>{user.fullName} (@{user.username})</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Kho xuất phát</Label><Select value={selectedWarehouse} onValueChange={(value) => value && setSelectedWarehouse(value)}><SelectTrigger className="w-full"><SelectValue placeholder="Chọn kho">{warehouses.find((warehouse) => String(warehouse.id) === selectedWarehouse)?.locationName ?? "Chọn kho"}</SelectValue></SelectTrigger><SelectContent>{warehouses.map((warehouse) => <SelectItem key={warehouse.id} value={String(warehouse.id)}>{warehouse.locationName}</SelectItem>)}</SelectContent></Select></div>
        </div>
        {!order.toLocation && <div className="min-w-0 space-y-2"><Label>Vị trí giao hàng</Label><p className="text-xs text-muted-foreground">Chọn vị trí giao trên bản đồ OSM.</p><LocationMap lat={deliveryPosition[0]} lng={deliveryPosition[1]} onPositionChange={(lat, lng) => setDeliveryPosition([lat, lng])} className="h-96 w-full overflow-hidden rounded-xl border" zoom={13} /><p className="text-xs text-muted-foreground">{deliveryPosition[0].toFixed(6)}, {deliveryPosition[1].toFixed(6)}</p></div>}
      </div>
      <DialogFooter><Button variant="outline" onClick={() => setAssignOpen(false)}>Hủy</Button><Button onClick={() => void handleAssignment()} disabled={busy || !selectedDriver || !selectedWarehouse}>{busy && <Loader2 className="mr-2 size-4 animate-spin" />}Xác nhận</Button></DialogFooter>
    </DialogContent></Dialog>

    <Dialog open={checkpointOpen} onOpenChange={setCheckpointOpen}><DialogContent>
      <DialogHeader><DialogTitle>Thêm điểm kho vào tuyến</DialogTitle><DialogDescription>Chọn kho đã ghé và ghi chú hành trình.</DialogDescription></DialogHeader>
      <div className="space-y-4"><div className="space-y-2"><Label>Kho</Label><Select value={selectedWarehouse} onValueChange={(value) => value && setSelectedWarehouse(value)}><SelectTrigger><SelectValue placeholder="Chọn kho">{warehouses.find((warehouse) => String(warehouse.id) === selectedWarehouse)?.locationName ?? "Chọn kho"}</SelectValue></SelectTrigger><SelectContent>{warehouses.map((warehouse) => <SelectItem key={warehouse.id} value={String(warehouse.id)}>{warehouse.locationName}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Mô tả</Label><Textarea value={description} maxLength={255} onChange={(event) => setDescription(event.target.value)} placeholder="Mô tả điểm cập nhật" /></div></div>
      <DialogFooter><Button variant="outline" onClick={() => setCheckpointOpen(false)}>Hủy</Button><Button onClick={() => void handleCheckpoint()} disabled={busy || !selectedWarehouse || !description.trim()}>{busy && <Loader2 className="mr-2 size-4 animate-spin" />}Lưu điểm</Button></DialogFooter>
    </DialogContent></Dialog>

    <Dialog open={deliveryResultOpen} onOpenChange={setDeliveryResultOpen}><DialogContent>
      <DialogHeader><DialogTitle>Kết quả giao đơn #{order.trackingNumber}</DialogTitle><DialogDescription>Thêm ảnh chứng minh trước khi hoàn tất kết quả giao hàng.</DialogDescription></DialogHeader>
      <div className="space-y-2"><Label htmlFor={`proof-${order.id}`}>Ảnh chứng minh (bắt buộc)</Label><Input id={`proof-${order.id}`} type="file" accept="image/*" onChange={(event) => setProofFile(event.target.files?.[0] ?? null)} /></div>
      <DialogFooter><Button variant="outline" onClick={() => void handleDelivery(OrderStatus.Returned)} disabled={busy}>{busy && <Loader2 className="mr-2 size-4 animate-spin" />}Giao thất bại</Button><Button onClick={() => void handleDelivery(OrderStatus.Delivered)} disabled={busy}>{busy && <Loader2 className="mr-2 size-4 animate-spin" />}Đã giao</Button></DialogFooter>
    </DialogContent></Dialog>

  </>;
}

function createColumns(warehouses: LocationDTO[], onUpdated: () => void): ColumnDef<Features, Order>[] {
  return [
    { id: "tracking", accessorFn: (order) => order.trackingNumber, header: ({ column }) => <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Mã đơn<ArrowUpDown className="ml-1 size-3" /></Button>, cell: ({ row }: { row: Row<Features, Order> }) => <span className="font-medium">#{row.original.trackingNumber}</span> },
    { id: "customer", accessorFn: (order) => `${order.customerName ?? ""} ${order.customerPhone ?? ""} ${order.address}`, header: "Khách hàng / giao đến", cell: ({ row }: { row: Row<Features, Order> }) => <div className="min-w-56"><p className="font-medium">{row.original.customerName || `Khách #${row.original.userId}`}</p><p className="text-xs text-muted-foreground">{row.original.customerPhone || ""}</p><p className="max-w-64 truncate text-xs text-muted-foreground" title={row.original.address}>{row.original.address}</p></div> },
    { id: "total", accessorFn: (order) => order.totalPrice, header: ({ column }) => <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Tổng tiền<ArrowUpDown className="ml-1 size-3" /></Button>, cell: ({ row }: { row: Row<Features, Order> }) => <span className="whitespace-nowrap font-semibold">{price(row.original.totalPrice)}</span> },
    { id: "status", accessorFn: (order) => OrderStatusLabels[order.status], header: "Trạng thái", cell: ({ row }: { row: Row<Features, Order> }) => <Badge variant={statusColor(row.original.status)}>{OrderStatusLabels[row.original.status] ?? "Không rõ"}</Badge> },
    { id: "createdAt", accessorFn: (order) => order.createdAt, header: ({ column }) => <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Ngày đặt<ArrowUpDown className="ml-1 size-3" /></Button>, cell: ({ row }: { row: Row<Features, Order> }) => <span className="whitespace-nowrap text-sm">{new Date(row.original.createdAt).toLocaleString("vi-VN")}</span> },
    { id: "actions", header: "Thao tác", cell: ({ row }: { row: Row<Features, Order> }) => <OrderActionCell order={row.original} warehouses={warehouses} onUpdated={onUpdated} /> },
  ];
}

export default function OrderManagementTable({ orders, onUpdated }: { orders: Order[]; onUpdated: () => void }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [warehouses, setWarehouses] = useState<LocationDTO[]>([]);
  useEffect(() => {
    void getAllWarehouses().then((response) => setWarehouses(response.success ? (response.data ?? []).filter((location) => location.status === LocationStatus.Active && location.isWarehouse) : []));
  }, []);

  const filteredData = useMemo(() => orders.filter((order) => (statusFilter === ALL || String(order.status) === statusFilter) && `${order.trackingNumber} ${order.customerName ?? ""} ${order.customerPhone ?? ""} ${order.address}`.toLowerCase().includes(globalFilter.toLowerCase())), [orders, statusFilter, globalFilter]);
  const columns = useMemo(() => createColumns(warehouses, onUpdated), [warehouses, onUpdated]);
  const table = useTable({ features, data: filteredData, columns, autoResetPageIndex: false, state: { globalFilter, sorting }, onGlobalFilterChange: setGlobalFilter, onSortingChange: setSorting });
  const pageCount = Math.max(1, Math.ceil(table.getRowModel().rows.length / pagination.pageSize));
  const displayedRows = table.getRowModel().rows.slice(pagination.pageIndex * pagination.pageSize, (pagination.pageIndex + 1) * pagination.pageSize);

  return <div className="space-y-4">
    <Card><CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Tìm mã đơn, khách hàng, số điện thoại..." value={globalFilter} onChange={(event) => { setGlobalFilter(event.target.value); setPagination((page) => ({ ...page, pageIndex: 0 })); }} /></div>
      <Select value={statusFilter} onValueChange={(value) => { if (value) { setStatusFilter(value); setPagination((page) => ({ ...page, pageIndex: 0 })); } }}><SelectTrigger className="w-full md:w-64"><SelectValue placeholder="Lọc trạng thái" /></SelectTrigger><SelectContent><SelectItem value={ALL}>Tất cả trạng thái</SelectItem>{Object.values(OrderStatus).filter((value): value is OrderStatus => typeof value === "number").map((status) => <SelectItem key={status} value={String(status)}>{OrderStatusLabels[status]}</SelectItem>)}</SelectContent></Select>
    </CardContent></Card>
    <div className="overflow-x-auto rounded-xl border bg-card"><Table><TableHeader>{table.getHeaderGroups().map((group: HeaderGroup<Features, Order>) => <TableRow key={group.id}>{group.headers.map((header: Header<Features, Order, unknown>) => <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
      <TableBody>{displayedRows.length ? displayedRows.map((row: Row<Features, Order>) => <TableRow key={row.id}>{row.getVisibleCells().map((cell: Cell<Features, Order, unknown>) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Không tìm thấy đơn hàng phù hợp.</TableCell></TableRow>}</TableBody></Table></div>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">{filteredData.length} đơn hàng</p><div className="flex items-center justify-between gap-3 sm:justify-end"><Select value={String(pagination.pageSize)} onValueChange={(value) => value && setPagination((page) => ({ ...page, pageSize: Number(value), pageIndex: 0 }))}><SelectTrigger className="w-20"><SelectValue /></SelectTrigger><SelectContent>{[10, 20, 50].map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent></Select><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Trước</Button><span className="self-center text-sm">{pagination.pageIndex + 1} / {pageCount}</span><Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Sau</Button></div></div></div>
  </div>;
}
