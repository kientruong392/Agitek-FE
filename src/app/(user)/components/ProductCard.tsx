"use client";

import Image from "next/image";
import { ShoppingCart, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/toast";
import { useCart } from "@/components/providers/CartProvider";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Product } from "@/types/model.types";
import { ProductStatus } from "@/types/model.types";

const FALLBACK_IMAGE = "/images/no-image.png";

function imageUrl(product: Product) {
  const primary = product.images?.find((image) => image.isPrimary) ?? product.images?.[0];
  return primary?.imageUrl || FALLBACK_IMAGE;
}

function formatPrice(value?: number, contactLabel?: string) {
  if (value == null) return contactLabel ?? "";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function statusVariant(status: ProductStatus) {
  switch (status) {
    case ProductStatus.InStock:
      return "default" as const;
    case ProductStatus.LowStock:
    case ProductStatus.PreOrder:
      return "secondary" as const;
    case ProductStatus.OutOfStock:
    case ProductStatus.Deleted:
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

export default function ProductCard({ product }: { product: Product }) {
  const t = useTranslations("Home");
  const cartT = useTranslations("Cart");
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const isPreOrder = product.status === ProductStatus.PreOrder;
  const isOutOfStock = product.status === ProductStatus.OutOfStock || product.stockQuantity <= 0;
  const canPurchase = isPreOrder || (!isOutOfStock && [ProductStatus.InStock, ProductStatus.LowStock].includes(product.status));
  const unavailable = !canPurchase;
  const effectiveStatus = isPreOrder
    ? ProductStatus.PreOrder
    : isOutOfStock
      ? ProductStatus.OutOfStock
      : product.status;
  const statusLabel = {
    [ProductStatus.Pending]: t("pending"),
    [ProductStatus.InStock]: t("inStock"),
    [ProductStatus.LowStock]: t("lowStock"),
    [ProductStatus.OutOfStock]: t("outOfStock"),
    [ProductStatus.Hidden]: t("hidden"),
    [ProductStatus.PreOrder]: t("preOrder"),
    [ProductStatus.Deleted]: t("deleted"),
  }[effectiveStatus] ?? t("outOfStock");
  const hasDiscount = product.discountPrice != null && product.discountPrice < product.originalPrice;
  const price = hasDiscount ? product.discountPrice : product.originalPrice;

  const handleAddToCart = async () => {
    setAdding(true);
    const added = await addItem(product.id, 1);
    setAdding(false);
    toast.add({ title: added ? cartT("addSuccess") : cartT("addError"), type: added ? "success" : "error" });
  };

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="h-full">
      <Card className="flex h-full flex-col overflow-hidden border-border/70">
        <div className="relative aspect-square shrink-0 bg-muted">
          <Image src={imageUrl(product)} alt={product.productName} fill className="object-contain p-4" unoptimized />
        </div>
        <CardContent className="flex flex-1 flex-col gap-2 p-3">
          <p className="line-clamp-2 min-h-10 font-medium">{product.productName}</p>
          <div className="flex min-h-7 items-center justify-between gap-2">
            <Badge variant={statusVariant(effectiveStatus)} className="max-w-[calc(100%-3rem)] truncate px-2 py-0.5 text-[11px]">
              {statusLabel}
            </Badge>
            <span className="flex shrink-0 items-center gap-1 text-sm" aria-label={`${(product.averageRating ?? 0).toFixed(1)} / 5`}>
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              {(product.averageRating ?? 0).toFixed(1)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{t("stockCount", { count: product.stockQuantity })}</p>
          <div className="mt-auto flex min-h-12 flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-1">
            <strong className="text-base leading-tight text-primary">
              {formatPrice(price, t("contactPrice"))}
            </strong>
            {hasDiscount && <del className="text-xs text-muted-foreground">{formatPrice(product.originalPrice)}</del>}
          </div>
        </CardContent>
        <CardFooter className="px-3 pb-3 pt-1">
          <Button className="w-full" disabled={unavailable || adding} variant={unavailable ? "outline" : "default"} onClick={() => void handleAddToCart()}>
            <ShoppingCart />
            {isOutOfStock && !isPreOrder ? t("outOfStock") : adding ? cartT("adding") : t("addtoCart")}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

