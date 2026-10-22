"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Clock3, PackageCheck, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WarrantyStatus } from "@/types/model.types";
import type { Order, Warranty } from "@/types/model.types";
import WarrantyRequestDialog from "./warranty-request-dialog";

const FALLBACK_IMAGE = "/images/no-image.png";

function getItemKey(orderId: number, productId: number) {
  return `${orderId}-${productId}`;
}

function warrantyStatusClassName(status: WarrantyStatus) {
  if (status === WarrantyStatus.Pending) return "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300";
  if (status === WarrantyStatus.Processing) return "border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-300";
  if (status === WarrantyStatus.Completed) return "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  return "border-destructive/30 bg-destructive/10 text-destructive";
}

function WarrantyCard({ warranty }: { warranty: Warranty }) {
  const t = useTranslations("Warranty");
  const locale = useLocale();
  const statusLabel = t(`statuses.${WarrantyStatus[warranty.status].toLowerCase()}` as "statuses.pending" | "statuses.processing" | "statuses.completed" | "statuses.rejected");
  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString(locale === "en" ? "en-US" : "vi-VN");
  };
  const productName = warranty.orderDetail?.productName || t("productFallback", { id: warranty.productId });
  const productImage = warranty.orderDetail?.productImageUrl || FALLBACK_IMAGE;
  const statusMessage = warranty.status === WarrantyStatus.Pending
    ? t("requestPendingDescription")
    : warranty.status === WarrantyStatus.Rejected
      ? warranty.response || t("requestRejectedFallback")
      : warranty.status === WarrantyStatus.Completed
        ? warranty.response || t("requestCompletedFallback")
        : warranty.response || t("requestPendingDescription");

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border bg-muted">
            <Image src={productImage} alt={productName} fill className="object-contain p-1" unoptimized />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="line-clamp-2 font-semibold">{productName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("orderNumber", { value: warranty.order?.trackingNumber || warranty.orderId })}</p>
              </div>
              <Badge variant="outline" className={warrantyStatusClassName(warranty.status)}>{statusLabel}</Badge>
            </div>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{statusMessage}</p>
            <p className="text-xs text-muted-foreground">{t("requestCreatedAt", { date: formatDate(warranty.createdAt) })}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WarrantyCenter({ orders, initialWarranties }: { orders: Order[]; initialWarranties: Warranty[] }) {
  const t = useTranslations("Warranty");
  const [warranties, setWarranties] = useState(initialWarranties);
  const activeWarrantyItemKeys = useMemo(() => (
    warranties
      .filter((warranty) => warranty.status === WarrantyStatus.Pending || warranty.status === WarrantyStatus.Processing)
      .map((warranty) => getItemKey(warranty.orderId, warranty.productId))
  ), [warranties]);

  function handleCreated(warranty: Warranty) {
    setWarranties((current) => [warranty, ...current]);
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><ShieldCheck className="size-5" /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t("title")}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>
        <WarrantyRequestDialog orders={orders} activeWarrantyItemKeys={activeWarrantyItemKeys} onCreated={handleCreated} />
      </header>

      <Card>
        <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">{t("myRequests")}</CardTitle>
            <CardDescription>{t("myRequestsDescription")}</CardDescription>
          </div>
          <Badge variant="secondary">{t("requestCount", { count: warranties.length })}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/warranties/packing-instructions" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <PackageCheck className="size-4" />
            {t("packingInstructions")}
          </Link>
          {warranties.length ? (
            <div className="space-y-4">{warranties.map((warranty) => <WarrantyCard key={warranty.id} warranty={warranty} />)}</div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-4 py-12 text-center">
              <Clock3 className="size-9 text-muted-foreground" />
              <p className="mt-3 font-medium">{t("noRequests")}</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">{t("noRequestsDescription")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
