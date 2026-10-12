import { notFound } from "next/navigation";
import { getAllBrands } from "@/actions/brand.action";
import { getCategoryWithProductsBySlug } from "@/actions/home.action";
import CategoryListing from "./components/CategoryListing";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [categoryResult, brandResult] = await Promise.all([
    getCategoryWithProductsBySlug(slug),
    getAllBrands(),
  ]);
  const category = categoryResult?.category ?? categoryResult;
  const products = category?.products ?? categoryResult?.products;

  if (!category?.categoryName || !Array.isArray(products)) notFound();

  const productBrandIds = new Set(products.map((product: { brandId: number }) => product.brandId));
  const brands = (brandResult.data ?? []).filter((brand) => productBrandIds.has(brand.id));

  return <CategoryListing category={category} products={products} brands={brands} />;
}
