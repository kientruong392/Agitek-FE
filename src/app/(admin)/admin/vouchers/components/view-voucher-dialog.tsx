"use client";

import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DiscountType, VoucherStatus, VoucherStatusLabels, DiscountTypeLabels } from "@/types/model.types";
import type { VoucherDTO } from "@/types/model.types";

interface ViewVoucherDialogProps {
  voucher: VoucherDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

export default function ViewVoucherDialog({ voucher, open, onOpenChange }: ViewVoucherDialogProps) {
  const t = useTranslations("AdminVouchers");

  if (!voucher) return null;

  const discountText = voucher.discountType === DiscountType.Percentage
    ? `${voucher.discountValue}%`
    : formatCurrency(voucher.discountValue);

  function getStatusVariant(status: VoucherStatus): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
      case VoucherStatus.Active: return "default";
      case VoucherStatus.Inactive: return "outline";
      case VoucherStatus.Expired: return "secondary";
      case VoucherStatus.LowStock: return "secondary";
      case VoucherStatus.OutOfStock: return "destructive";
      default: return "outline";
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("viewDetailTitle")}</DialogTitle>
          <DialogDescription className="sr-only">{voucher.code}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 py-4 border-b">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold">{voucher.name}</h3>
            <p className="text-sm text-muted-foreground font-mono">{voucher.code}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={getStatusVariant(voucher.status)}>
                {VoucherStatusLabels[voucher.status]}
              </Badge>
              <Badge variant="secondary">
                {DiscountTypeLabels[voucher.discountType]}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <InfoItem label={t("discountValue")} value={discountText} />
          <InfoItem
            label={t("maxDiscountValue")}
            value={voucher.maxDiscountValue ? formatCurrency(voucher.maxDiscountValue) : "—"}
          />
          <InfoItem
            label={t("minOrderValue")}
            value={formatCurrency(voucher.minOrderValue)}
          />
          <InfoItem
            label={t("quantityInfo")}
            value={`${voucher.quantity} / ${voucher.initialQuantity} (Đã dùng: ${voucher.usedCount})`}
          />
          <InfoItem label={t("startDate")} value={formatDate(voucher.startDate)} />
          <InfoItem label={t("endDate")} value={formatDate(voucher.endDate)} />
        </div>

        {voucher.description && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">{t("descriptionLabel")}</h4>
            <p className="text-sm whitespace-pre-wrap">{voucher.description}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
