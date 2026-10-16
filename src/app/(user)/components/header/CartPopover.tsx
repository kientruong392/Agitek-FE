"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { getProductById } from "@/actions/product.action";
import { toast } from "@/components/ui/toast";
import { useCart } from "@/components/providers/CartProvider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

export default function CartPopover() {
  const t = useTranslations("Cart");
  const { items, isLoading, removeItem } = useCart();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [productData, setProductData] = useState<Record<number, { name: string; image: string; price: number }>>({});
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const loadingIds = useRef(new Set<number>());
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const allSelected = items.length > 0 && items.every((item) => selectedSet.has(item.productId));

  const loadProduct = useCallback(async (productId: number) => {
    if (productData[productId] || loadingIds.current.has(productId)) return;
    loadingIds.current.add(productId);
    const response = await getProductById(productId);
    loadingIds.current.delete(productId);
    if (!response.success || !response.data) return;
    const product = response.data;
    const image = product.images?.find((candidate) => candidate.isPrimary) ?? product.images?.[0];
    const price = product.discountPrice != null && product.discountPrice < product.originalPrice
      ? product.discountPrice
      : product.originalPrice;
    setProductData((current) => ({
      ...current,
      [productId]: { name: product.productName, image: image?.imageUrl || "/images/no-image.png", price },
    }));
  }, [productData]);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => items.some((item) => item.productId === id)));
  }, [items]);

  useEffect(() => {
    items.forEach((item) => {
      if (!productData[item.productId] && !loadingIds.current.has(item.productId)) void loadProduct(item.productId);
    });
  }, [items, loadProduct, productData]);

  const toggleSelected = (productId: number, checked: boolean) => {
    setSelectedIds((current) => checked ? [...new Set([...current, productId])] : current.filter((id) => id !== productId));
  };

  const remove = async (productId: number) => {
    if (!await removeItem(productId)) {
      toast.add({ title: t("removeError"), type: "error" });
      return;
    }
    setSelectedIds((current) => current.filter((id) => id !== productId));
    toast.add({ title: t("removeSuccess"), type: "success" });
  };

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="icon" aria-label={t("title")} className="relative" />}>
        <ShoppingCart />
        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
          {totalQuantity}
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] gap-3">
        <PopoverHeader>
          <PopoverTitle>{t("title")} ({totalQuantity})</PopoverTitle>
        </PopoverHeader>
        {items.length > 0 && <label className="flex items-center gap-2 border-b pb-3 text-sm font-medium">
          <Checkbox checked={allSelected} onCheckedChange={(checked) => setSelectedIds(checked === true ? items.map((item) => item.productId) : [])} />
          {t("selectAll")}
        </label>}
        <div className="max-h-88 space-y-2 overflow-y-auto pr-1">
          {isLoading ? <p className="py-6 text-center text-sm text-muted-foreground">{t("loading")}</p> : items.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{t("empty")}</p> : items.map((item) => {
            const product = productData[item.productId];
            return <div key={item.productId} className="flex items-center gap-3 rounded-xl border p-2">
              <Checkbox checked={selectedSet.has(item.productId)} onCheckedChange={(checked) => toggleSelected(item.productId, checked === true)} aria-label={t("selectItem", { name: product?.name ?? item.productId })} />
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={product?.image || "/images/no-image.png"} alt={product?.name || ""} fill sizes="56px" className="object-contain p-1" unoptimized />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium">{product?.name ?? t("loadingProduct")}</p>
                <p className="text-xs text-muted-foreground">{t("quantity", { count: item.quantity })}</p>
                {product && <p className="text-sm font-semibold text-primary">{formatPrice(product.price)}</p>}
              </div>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={t("removeItem")} onClick={() => void remove(item.productId)}>
                <Trash2 className="size-4" />
              </Button>
            </div>;
          })}
        </div>
        {items.length > 0 && <Button nativeButton={false} render={<Link href="/checkout" />} className="w-full">{t("goToCheckout")}</Button>}
      </PopoverContent>
    </Popover>
  );
}
