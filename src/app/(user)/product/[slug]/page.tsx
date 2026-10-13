import { notFound } from "next/navigation";
import { getProductBySlug, getProductReviews } from "@/actions/product.action";
import ProductDetail from "./components/ProductDetail";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const productResult = await getProductBySlug(slug);
  const product = productResult.data;

  if (!productResult.success || !product) notFound();

  const reviewResult = await getProductReviews(product.id);
  const reviews = reviewResult.success && Array.isArray(reviewResult.data) ? reviewResult.data : [];

  return <ProductDetail product={product} reviews={reviews} />;
}
