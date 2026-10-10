"use client";

import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Product } from "@/types/model.types";
import { ProductStatus, ProductStatusLabels } from "@/types/model.types";

const FALLBACK_IMAGE = "/images/no-image.png";

function imageUrl(product: Product) {
  const primary = product.images?.find((image) => image.isPrimary) ?? product.images?.[0];
  return primary?.imageUrl || FALLBACK_IMAGE;
}

function formatPrice(value?: number, contactLabel = "Liên hệ") {
  if (value == null) return contactLabel;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

export default function ProductCard({ product }: { product: Product }) {
  const t = useTranslations("Home");
  const unavailable = product.status === ProductStatus.OutOfStock;
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="h-full">
      <Card className="h-full overflow-hidden border-border/70">
        <div className="relative aspect-square bg-muted">
          <Image src={imageUrl(product)} alt={product.productName} fill className="object-contain p-5" unoptimized />
        </div>
        <CardContent className="flex flex-col gap-2 p-4">
          <p className="line-clamp-2 min-h-10 font-medium">{product.productName}</p>
          <span className="text-xs text-muted-foreground">{ProductStatusLabels[product.status] ?? ""}</span>
          <div className="flex flex-wrap items-baseline gap-2">
            <strong className="text-lg text-primary">{formatPrice(product.discountPrice ?? product.originalPrice, t("contactPrice"))}</strong>
            {product.discountPrice != null && product.discountPrice < product.originalPrice && (
              <del className="text-xs text-muted-foreground">{formatPrice(product.originalPrice)}</del>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button className="w-full" disabled={unavailable} variant={unavailable ? "outline" : "default"}>
            <ShoppingCart />
            {unavailable ? t("outOfStock") : t("addtoCart")}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

