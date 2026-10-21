"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ClipboardList, PackageCheck, RotateCcw, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import ReviewDialog from "./review-dialog";
import type { Order } from "@/types/model.types";
import { OrderStatus, OrderStatusLabels } from "@/types/model.types";

const FALLBACK_IMAGE = "/images/no-image.png";
const ALL_STATUSES = "all";

const statusFilters = [
  { value: ALL_STATUSES, label: "Tất cả" },
  { value: String(OrderStatus.Ordered), label: OrderStatusLabels[OrderStatus.Ordered] },
  { value: String(OrderStatus.Confirmed), label: OrderStatusLabels[OrderStatus.Confirmed] },
  { value: String(OrderStatus.Shipped), label: OrderStatusLabels[OrderStatus.Shipped] },
  { value: String(OrderStatus.InTransit), label: OrderStatusLabels[OrderStatus.InTransit] },
  { value: String(OrderStatus.Delivered), label: OrderStatusLabels[OrderStatus.Delivered] },
  { value: String(OrderStatus.Returned), label: OrderStatusLabels[OrderStatus.Returned] },
  { value: String(OrderStatus.Cancelled), label: OrderStatusLabels[OrderStatus.Cancelled] },
  { value: String(OrderStatus.Refunded), label: OrderStatusLabels[OrderStatus.Refunded] },
  { value: String(OrderStatus.Paid), label: OrderStatusLabels[OrderStatus.Paid] },
];

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function statusVariant(status: OrderStatus) {
  switch (status) {
    case OrderStatus.Completed:
    case OrderStatus.Delivered:
    case OrderStatus.Paid:
      return "default" as const;
    case OrderStatus.Cancelled:
    case OrderStatus.Returned:
    case OrderStatus.Refunded:
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function OrderCard({
  order,
  reviewedItems,
  onReviewed,
}: {
  order: Order;
  reviewedItems: Map<string, number>;
  onReviewed: (productId: number, reviewId: number) => void;
}) {
  return (
    <Card className="border-border/70">
      <CardHeader className="gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            <span>Đơn hàng #{order.trackingNumber || order.id}</span>
            <Badge variant={statusVariant(order.status)}>{OrderStatusLabels[order.status] ?? "Đang xử lý"}</Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">Đặt lúc {formatDate(order.createdAt)}</p>
        </div>
      </CardHeader>

      <CardContent className="divide-y px-4 sm:px-6">
        {order.orderDetails.map((item) => {
          const isDelivered = order.status === OrderStatus.Delivered;
          const itemKey = `${order.id}-${item.productId}`;
          const reviewId = item.reviewId ?? reviewedItems.get(itemKey);
          const hasReview = item.hasReview || reviewId != null;

          return (
            <div key={`${item.orderId}-${item.productId}`} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center">
              <Link href={`/product/${item.productSlug}`} className="flex min-w-0 flex-1 items-center gap-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border bg-muted sm:size-24">
                  <Image
                    src={item.productImageUrl || FALLBACK_IMAGE}
                    alt={item.productName}
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="line-clamp-2 font-medium text-foreground">{item.productName || `Sản phẩm #${item.productId}`}</p>
                  <p className="text-sm text-muted-foreground">Số lượng: {item.quantity}</p>
                  <p className="text-sm text-muted-foreground">Đơn giá: {formatPrice(item.unitPrice)}</p>
                </div>
              </Link>
              <div className="flex items-center justify-between gap-3 border-t pt-3 sm:w-56 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                <span className="font-semibold">{formatPrice(item.totalPrice)}</span>
                {isDelivered && (
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" disabled>
                      <RotateCcw className="size-4" />
                      Trả hàng/hoàn tiền
                    </Button>
                    {hasReview ? (
                      <Button
                        nativeButton={false}
                        render={<Link href={reviewId != null ? `/product/${item.productSlug}?reviewid=${reviewId}` : `/product/${item.productSlug}#reviews`} />}
                        type="button"
                        variant="outline"
                        size="sm"
                      >
                        <Star className="size-4 fill-yellow-400 text-yellow-400" />
                        Xem đánh giá
                      </Button>
                    ) : (
                      <ReviewDialog order={order} item={item} onSubmitted={(newReviewId) => onReviewed(item.productId, newReviewId)} />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>

      <CardFooter className="flex flex-wrap justify-between gap-3 border-t bg-muted/20 py-4">
        <span className="text-sm text-muted-foreground">
          {order.orderDetails.reduce((total, item) => total + item.quantity, 0)} sản phẩm
        </span>
        <div className="text-right">
          <span className="mr-3 text-sm text-muted-foreground">Thành tiền</span>
          <strong className="text-lg text-primary">{formatPrice(order.totalPrice)}</strong>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function OrderHistory({ orders }: { orders: Order[] }) {
  const [activeStatus, setActiveStatus] = useState(ALL_STATUSES);
  const [reviewedItems, setReviewedItems] = useState<Map<string, number>>(() => new Map());
  const filteredOrders = useMemo(
    () => activeStatus === ALL_STATUSES ? orders : orders.filter((order) => String(order.status) === activeStatus),
    [activeStatus, orders],
  );
  const filters = useMemo(() => statusFilters.map((filter) => ({
    ...filter,
    count: filter.value === ALL_STATUSES ? orders.length : orders.filter((order) => String(order.status) === filter.value).length,
  })), [orders]);
  const selectedFilter = filters.find((filter) => filter.value === activeStatus);

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-primary"><ClipboardList className="size-4" />Tài khoản của bạn</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Đơn hàng của tôi</h1>
          <p className="mt-1 text-sm text-muted-foreground">Theo dõi trạng thái và xem lại các sản phẩm bạn đã đặt.</p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground sm:self-auto">
          <PackageCheck className="size-4" />{orders.length} đơn hàng
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Lọc đơn hàng</p>
          <p className="text-sm text-muted-foreground">Chọn trạng thái cần xem</p>
        </div>
        <Select value={activeStatus} onValueChange={(value) => value && setActiveStatus(value)}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Tất cả">
              {selectedFilter && <span className="truncate">{selectedFilter.label} ({selectedFilter.count})</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="end">
            {filters.map((filter) => <SelectItem key={filter.value} value={filter.value}>{filter.label} ({filter.count})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredOrders.length ? (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              reviewedItems={reviewedItems}
              onReviewed={(productId, reviewId) => setReviewedItems((current) => {
                const next = new Map(current);
                next.set(`${order.id}-${productId}`, reviewId);
                return next;
              })}
            />
          ))
        ) : (
          <Card className="border-dashed shadow-none ring-0">
            <CardContent className="flex flex-col items-center px-6 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><PackageCheck className="size-7" /></div>
              <h2 className="mt-4 font-semibold">{orders.length ? "Không có đơn hàng ở trạng thái này" : "Bạn chưa có đơn hàng nào"}</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">{orders.length ? "Hãy chọn trạng thái khác để xem các đơn hàng." : "Các đơn hàng bạn đặt sẽ được hiển thị tại đây."}</p>
              {!orders.length && <Button nativeButton={false} render={<Link href="/" />} className="mt-5">Khám phá sản phẩm</Button>}
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
