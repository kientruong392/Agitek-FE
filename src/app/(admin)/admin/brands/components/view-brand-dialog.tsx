"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Brand } from "@/types/model.types";
import { ProductStatusLabels } from "@/types/model.types";

interface ViewBrandDialogProps {
  brand: Brand | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ViewBrandDialog({ brand, open, onOpenChange }: ViewBrandDialogProps) {
  const t = useTranslations("AdminBrands");
  if (!brand) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("viewDetailSuccess")}</DialogTitle>
          <DialogDescription className="sr-only">{brand.name}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 py-4">
          <div className="size-20 shrink-0 overflow-hidden rounded-xl border bg-muted p-1">
            <Image
              src={brand.logoUrl || "/images/no-image.png"}
              alt={brand.name}
              width={80}
              height={80}
              className="size-full object-contain"
              unoptimized
            />
          </div>
          <div className="flex flex-col">
            <h3 className="text-2xl font-bold">{brand.name}</h3>
            <p className="font-mono text-sm text-muted-foreground">#{brand.code}</p>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="mb-2 text-lg font-semibold">Products</h4>
          <div className="rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brand.products && brand.products.length > 0 ? (
                  brand.products.map((p) => (
                    <TableRow key={p.id} className={p.deletedAt ? "opacity-50 border-dashed bg-muted/20" : ""}>
                      <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                      <TableCell className="font-medium">{p.productName}</TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p.discountPrice || p.originalPrice)}
                      </TableCell>
                      <TableCell>
                        {p.deletedAt ? (
                          <span className="text-destructive font-medium">{t("deleted")}</span>
                        ) : (
                          ProductStatusLabels[p.status]
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
