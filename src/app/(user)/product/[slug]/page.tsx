import { notFound } from "next/navigation";
import { getProductBySlug, getProductReviews } from "@/actions/product.action";
import ProductDetail from "./components/ProductDetail";

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reviewid?: string | string[] }>;
}) {
  const [{ slug }, { reviewid }] = await Promise.all([params, searchParams]);
  const productResult = await getProductBySlug(slug);
  const product = productResult.data;

  if (!productResult.success || !product) notFound();

  const reviewResult = await getProductReviews(product.id);
  const reviews = reviewResult.success && Array.isArray(reviewResult.data) ? reviewResult.data : [];
  const requestedReviewId = typeof reviewid === "string" ? Number(reviewid) : undefined;
  const highlightedReviewId = Number.isSafeInteger(requestedReviewId) && requestedReviewId > 0
    ? requestedReviewId
    : undefined;

  return <ProductDetail product={product} reviews={reviews} highlightedReviewId={highlightedReviewId} />;
}
