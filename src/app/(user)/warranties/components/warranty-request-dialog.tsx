"use client";

import Image from "next/image";
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { CircleAlert, CircleCheck, ImageIcon, Loader2, PackageOpen, ReceiptText, ShieldCheck, Upload, Video, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { createWarranty } from "@/actions/warranty.action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { uploadMediaToCloudinary } from "@/lib/cloudinary";
import { OrderStatus } from "@/types/model.types";
import type { Order, OrderDetail, Warranty } from "@/types/model.types";

const FALLBACK_IMAGE = "/images/no-image.png";
const MAX_MEDIA_FILES = 5;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_TOTAL_MEDIA_SIZE_BYTES = 100 * 1024 * 1024;

interface PendingMedia {
  id: string;
  file: File;
  previewUrl: string;
  isVideo: boolean;
}

type EligibilityStatus = "eligible" | "expired" | "noWarranty" | "orderNotDelivered" | "activeWarranty";

interface WarrantyEligibility {
  status: EligibilityStatus;
  expiresAt?: Date;
}

interface WarrantyRequestDialogProps {
  orders: Order[];
  activeWarrantyItemKeys: string[];
  onCreated: (warranty: Warranty) => void;
}

function getItemKey(orderId: number, productId: number) {
  return `${orderId}-${productId}`;
}

function getWarrantyEligibility(order: Order, item: OrderDetail, activeWarrantyItemKeys: Set<string>): WarrantyEligibility {
  if (order.status !== OrderStatus.Delivered && order.status !== OrderStatus.Completed) {
    return { status: "orderNotDelivered" };
  }
  if (item.warrantyPeriod <= 0) return { status: "noWarranty" };

  const deliveredAt = new Date(order.updatedAt);
  if (Number.isNaN(deliveredAt.getTime())) return { status: "expired" };
  const expiresAt = new Date(deliveredAt);
  expiresAt.setMonth(expiresAt.getMonth() + item.warrantyPeriod);
  if (expiresAt < new Date()) return { status: "expired", expiresAt };
  if (activeWarrantyItemKeys.has(getItemKey(order.id, item.productId))) return { status: "activeWarranty", expiresAt };
  return { status: "eligible", expiresAt };
}

export default function WarrantyRequestDialog({ orders, activeWarrantyItemKeys, onCreated }: WarrantyRequestDialogProps) {
  const t = useTranslations("Warranty");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [warrantyQuantity, setWarrantyQuantity] = useState(1);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [productCondition, setProductCondition] = useState("");
  const [medias, setMedias] = useState<PendingMedia[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef(new Set<string>());
  const activeWarrantyKeySet = useMemo(() => new Set(activeWarrantyItemKeys), [activeWarrantyItemKeys]);
  const selectedOrder = useMemo(() => orders.find((order) => String(order.id) === selectedOrderId), [orders, selectedOrderId]);
  const selectedProduct = useMemo(() => selectedOrder?.orderDetails.find((item) => String(item.productId) === selectedProductId), [selectedOrder, selectedProductId]);
  const eligibility = useMemo(() => selectedOrder && selectedProduct ? getWarrantyEligibility(selectedOrder, selectedProduct, activeWarrantyKeySet) : null, [activeWarrantyKeySet, selectedOrder, selectedProduct]);
  const dateLocale = locale === "en" ? "en-US" : "vi-VN";
  const formatDate = (value?: Date | string | null) => {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(dateLocale);
  };
  const formatPrice = (value: number) => new Intl.NumberFormat(dateLocale, { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
  const orderSelectItems = orders.map((order) => ({
    value: String(order.id),
    label: t("orderOption", { value: order.trackingNumber || order.id, date: formatDate(order.createdAt) }),
  }));
  const productSelectItems = (selectedOrder?.orderDetails ?? []).map((item) => ({
    value: String(item.productId),
    label: t("productOption", { name: item.productName || t("productFallback", { id: item.productId }), quantity: item.quantity }),
  }));

  function resetForm() {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current.clear();
    setSelectedOrderId("");
    setSelectedProductId("");
    setWarrantyQuantity(1);
    setFullName("");
    setPhoneNumber("");
    setAddress("");
    setProductCondition("");
    setMedias([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  useEffect(() => () => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) return;
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  }

  function handleOrderChange(orderId: string | null) {
    setSelectedOrderId(orderId || "");
    setSelectedProductId("");
    setWarrantyQuantity(1);
  }

  function handleProductChange(productId: string | null) {
    setSelectedProductId(productId || "");
    setWarrantyQuantity(1);
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const remainingSlots = MAX_MEDIA_FILES - medias.length;
    let acceptedSize = medias.reduce((total, media) => total + media.file.size, 0);
    let exceedsFileLimit = false;
    let exceedsTotalLimit = false;
    let hasUnsupportedFile = false;
    let exceedsSlotLimit = false;
    const acceptedFiles: File[] = [];

    for (const file of files) {
      if (acceptedFiles.length >= remainingSlots) {
        exceedsSlotLimit = true;
        continue;
      }

      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isImage && !isVideo) {
        hasUnsupportedFile = true;
        continue;
      }
      if (file.size > (isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES)) {
        exceedsFileLimit = true;
        continue;
      }
      if (acceptedSize + file.size > MAX_TOTAL_MEDIA_SIZE_BYTES) {
        exceedsTotalLimit = true;
        continue;
      }

      acceptedFiles.push(file);
      acceptedSize += file.size;
    }

    if (exceedsSlotLimit) toast.add({ title: t("maxFiles", { count: MAX_MEDIA_FILES }), type: "error" });
    if (hasUnsupportedFile) toast.add({ title: t("unsupportedFile"), type: "error" });
    if (exceedsFileLimit) toast.add({ title: t("fileSize"), type: "error" });
    if (exceedsTotalLimit) toast.add({ title: t("totalFileSize"), type: "error" });

    const newMedias = acceptedFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);
      return { id: crypto.randomUUID(), file, previewUrl, isVideo: file.type.startsWith("video/") };
    });

    setMedias((current) => [...current, ...newMedias]);
    event.target.value = "";
  }

  function removeMedia(media: PendingMedia) {
    URL.revokeObjectURL(media.previewUrl);
    previewUrlsRef.current.delete(media.previewUrl);
    setMedias((current) => current.filter((item) => item.id !== media.id));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrder || !selectedProduct || !fullName.trim() || !phoneNumber.trim() || !address.trim() || !productCondition.trim()) {
      toast.add({ title: t("requiredInformation"), type: "error" });
      return;
    }
    if (!eligibility || eligibility.status !== "eligible") {
      toast.add({ title: t("ineligibleProduct"), type: "error" });
      return;
    }
    if (warrantyQuantity < 1 || warrantyQuantity > selectedProduct.quantity) {
      toast.add({ title: t("invalidWarrantyQuantity", { count: selectedProduct.quantity }), type: "error" });
      return;
    }
    if (!medias.length) {
      toast.add({ title: t("requiredEvidence"), type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedMedias: { mediaUrl: string }[] = [];
      for (const media of medias) {
        const response = await uploadMediaToCloudinary(media.file, "agitek/warranties");
        if (!response.success || !response.data?.secure_url) {
          toast.add({ title: response.message || t("uploadFailed"), type: "error" });
          return;
        }
        uploadedMedias.push({ mediaUrl: response.data.secure_url });
      }

      const response = await createWarranty({
        orderId: selectedOrder.id,
        productId: selectedProduct.productId,
        quantity: warrantyQuantity,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        productCondition: productCondition.trim(),
        medias: uploadedMedias,
      });
      if (!response.success || !response.data) {
        toast.add({ title: response.message || t("submitFailed"), type: "error" });
        return;
      }

      toast.add({ title: t("submitSuccess"), type: "success" });
      onCreated(response.data);
      resetForm();
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  const eligibilityDescription = eligibility?.status === "eligible"
    ? t("eligibleDescription", { date: formatDate(eligibility.expiresAt) })
    : eligibility?.status === "expired"
      ? t("expiredDescription", { date: formatDate(eligibility.expiresAt) })
      : eligibility?.status === "noWarranty"
        ? t("noWarrantyDescription")
        : eligibility?.status === "orderNotDelivered"
          ? t("orderNotDeliveredDescription")
          : eligibility?.status === "activeWarranty"
            ? t("activeWarrantyDescription")
            : "";
  const eligibilityTitle = eligibility ? t(eligibility.status) : "";
  const isEligible = eligibility?.status === "eligible";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" disabled={!orders.length} />}><ShieldCheck className="size-4" />{t("createRequest")}</DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-5xl overflow-y-auto p-5 sm:max-w-5xl sm:p-6">
        <DialogHeader><DialogTitle>{t("dialogTitle")}</DialogTitle><DialogDescription>{t("dialogDescription")}</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <section className="space-y-5">
              <div className="space-y-2"><label htmlFor="warranty-order" className="text-sm font-medium">{t("selectOrder")}</label><Select items={orderSelectItems} value={selectedOrderId} onValueChange={handleOrderChange} disabled={isSubmitting}><SelectTrigger id="warranty-order"><SelectValue placeholder={t("selectOrderPlaceholder")} /></SelectTrigger><SelectContent>{orderSelectItems.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>

              {selectedOrder && <div className="space-y-3 rounded-2xl border bg-muted/30 p-4"><div className="flex items-center gap-2"><ReceiptText className="size-4 text-primary" /><p className="font-semibold">{t("orderDetails")}</p></div><div className="grid gap-3 text-sm sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">{t("orderNumber", { value: selectedOrder.trackingNumber || selectedOrder.id })}</p><p className="mt-1 font-medium">{t("orderItemCount", { count: selectedOrder.orderDetails.length })}</p></div><div><p className="text-xs text-muted-foreground">{t("orderDate")}</p><p className="mt-1 font-medium">{formatDate(selectedOrder.createdAt)}</p></div><div><p className="text-xs text-muted-foreground">{t("orderTotal")}</p><p className="mt-1 font-medium text-primary">{formatPrice(selectedOrder.totalPrice)}</p></div><div><p className="text-xs text-muted-foreground">{t("orderAddress")}</p><p className="mt-1 line-clamp-2">{selectedOrder.address}</p></div></div></div>}

              <div className="space-y-2"><label htmlFor="warranty-product" className="text-sm font-medium">{t("selectProduct")}</label><Select items={productSelectItems} value={selectedProductId} onValueChange={handleProductChange} disabled={!selectedOrder || isSubmitting}><SelectTrigger id="warranty-product"><SelectValue placeholder={selectedOrder ? t("selectProductPlaceholder") : t("selectOrderFirst")} /></SelectTrigger><SelectContent>{productSelectItems.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>

              {selectedProduct && eligibility && <div className="space-y-4 rounded-2xl border p-4"><div className="flex items-start gap-3"><div className="relative size-20 shrink-0 overflow-hidden rounded-xl border bg-muted"><Image src={selectedProduct.productImageUrl || FALLBACK_IMAGE} alt={selectedProduct.productName || t("productFallback", { id: selectedProduct.productId })} fill className="object-contain p-1" unoptimized /></div><div className="min-w-0 flex-1"><p className="line-clamp-2 font-semibold">{selectedProduct.productName || t("productFallback", { id: selectedProduct.productId })}</p><p className="mt-1 text-sm text-muted-foreground">{t("productDetails", { order: selectedOrder?.trackingNumber || selectedOrder?.id, months: selectedProduct.warrantyPeriod })}</p></div></div><div className="space-y-2"><label htmlFor="warranty-quantity" className="text-sm font-medium">{t("warrantyQuantity")}</label><Input id="warranty-quantity" type="number" min={1} max={selectedProduct.quantity} value={warrantyQuantity} onChange={(event) => { const value = Number(event.target.value); setWarrantyQuantity(Number.isFinite(value) ? Math.min(selectedProduct.quantity, Math.max(1, Math.trunc(value))) : 1); }} disabled={!isEligible || isSubmitting} required /><p className="text-xs text-muted-foreground">{t("warrantyQuantityHint", { count: selectedProduct.quantity })}</p></div><div className={`flex gap-3 rounded-xl border p-3 ${isEligible ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/30 bg-destructive/5"}`}><div className={isEligible ? "text-emerald-600" : "text-destructive"}>{isEligible ? <CircleCheck className="mt-0.5 size-5" /> : <CircleAlert className="mt-0.5 size-5" />}</div><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{t("eligibility")}</p><Badge variant={isEligible ? "default" : "destructive"}>{eligibilityTitle}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{eligibilityDescription}</p></div></div></div>}
            </section>

            <section className="space-y-5 rounded-2xl border bg-muted/15 p-4 sm:p-5">
              <div className="flex items-center gap-2"><PackageOpen className="size-4 text-primary" /><p className="font-semibold">{t("requestInformation")}</p></div>
              <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><label htmlFor="warranty-name" className="text-sm font-medium">{t("fullName")}</label><Input id="warranty-name" value={fullName} onChange={(event) => setFullName(event.target.value)} maxLength={100} required disabled={isSubmitting} /></div><div className="space-y-2"><label htmlFor="warranty-phone" className="text-sm font-medium">{t("phoneNumber")}</label><Input id="warranty-phone" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} maxLength={20} required disabled={isSubmitting} /></div></div>
              <div className="space-y-2"><label htmlFor="warranty-address" className="text-sm font-medium">{t("returnAddress")}</label><Textarea id="warranty-address" value={address} onChange={(event) => setAddress(event.target.value)} maxLength={500} required disabled={isSubmitting} className="min-h-20" /><p className="text-right text-xs text-muted-foreground">{address.length}/500</p></div>
              <div className="space-y-2"><label htmlFor="warranty-condition" className="text-sm font-medium">{t("productConditionLabel")}</label><Textarea id="warranty-condition" value={productCondition} onChange={(event) => setProductCondition(event.target.value)} maxLength={1000} placeholder={t("productConditionPlaceholder")} required disabled={isSubmitting} className="min-h-28" /><p className="text-right text-xs text-muted-foreground">{productCondition.length}/1000</p></div>
              <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium">{t("evidence")}</p><p className="text-xs text-muted-foreground">{t("evidenceHint", { count: MAX_MEDIA_FILES })}</p></div><Button type="button" variant="outline" size="sm" disabled={medias.length >= MAX_MEDIA_FILES || isSubmitting} onClick={() => fileInputRef.current?.click()}><Upload className="size-4" />{t("chooseFiles")}</Button><input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFiles} /></div>{medias.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{medias.map((media) => <div key={media.id} className="group relative aspect-square overflow-hidden rounded-xl border bg-muted">{media.isVideo ? <video src={media.previewUrl} controls className="size-full object-cover" /> : <Image src={media.previewUrl} alt={t("attachmentAlt")} fill className="object-cover" unoptimized />}<div className="absolute left-2 top-2 rounded-full bg-background/90 p-1.5 text-muted-foreground shadow-sm">{media.isVideo ? <Video className="size-3.5" /> : <ImageIcon className="size-3.5" />}</div><Button type="button" variant="destructive" size="icon-xs" className="absolute right-2 top-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100" aria-label={t("removeAttachment")} disabled={isSubmitting} onClick={() => removeMedia(media)}><X className="size-3.5" /></Button></div>)}</div>}</div>
            </section>
          </div>
          <DialogFooter><Button type="button" variant="outline" disabled={isSubmitting} onClick={() => handleOpenChange(false)}>{t("cancel")}</Button><Button type="submit" disabled={isSubmitting || !isEligible}>{isSubmitting && <Loader2 className="size-4 animate-spin" />}{t("submit")}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
