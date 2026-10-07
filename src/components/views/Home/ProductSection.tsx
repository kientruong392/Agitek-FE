"use client";

import { motion } from "motion/react";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ProductCard from "./ProductCard";
import type { Product } from "@/types/model.types";

export default function ProductSection({ title, products, isLoading, error }: {
  title: string;
  products?: Product[];
  isLoading?: boolean;
  error?: Error | null;
}) {
  const t = useTranslations("Home");
  return (
    <section className="py-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Agitek PC</p>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
        </div>
        <Button variant="link" className="hidden sm:inline-flex">{t("viewAll")}</Button>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{t("loadError")}</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : products?.length ? (
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={{ visible: { transition: { staggerChildren: 0.06 } } }} className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}
        </motion.div>
      ) : (
        <div className="rounded-3xl border border-dashed p-8 text-center text-sm text-muted-foreground">{t("emptyCategory")}</div>
      )}
    </section>
  );
}