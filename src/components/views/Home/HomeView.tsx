"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import HeroCarousel from "@/components/views/Home/HeroCarousel";
import ProductSection from "@/components/views/Home/ProductSection";
import {
  getFeaturedProducts,
  getNewestProducts,
  getCategoryWithProductsBySlug,
} from "@/actions/home.action";

export default function HomeView() {
  const t = useTranslations("Home");
  const featured = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => getFeaturedProducts(4),
  });
  const newest = useQuery({
    queryKey: ["products", "newest"],
    queryFn: () => getNewestProducts(4),
  });
  const officePC = useQuery({
    queryKey: ["category-products", "pc-van-phong"],
    queryFn: () => getCategoryWithProductsBySlug("pc-van-phong"),
  });
  const gamingPC = useQuery({
    queryKey: ["category-products", "pc-gaming"],
    queryFn: () => getCategoryWithProductsBySlug("pc-gaming"),
  });
  const components = useQuery({
    queryKey: ["category-products", "linh-kien-may-tinh"],
    queryFn: () => getCategoryWithProductsBySlug("linh-kien-may-tinh"),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      <HeroCarousel />
      <ProductSection title={t("featured")} products={featured.data?.products} isLoading={featured.isLoading} error={featured.error} />
      <ProductSection title={t("newest")} products={newest.data} isLoading={newest.isLoading} error={newest.error} />
      <ProductSection title={t("officePC")} products={officePC.data?.products} isLoading={officePC.isLoading} error={officePC.error} />
      <ProductSection title={t("gamingPC")} products={gamingPC.data?.products} isLoading={gamingPC.isLoading} error={gamingPC.error} />
      <ProductSection title={t("components")} products={components.data?.products} isLoading={components.isLoading} error={components.error} />
    </div>
  );
}
