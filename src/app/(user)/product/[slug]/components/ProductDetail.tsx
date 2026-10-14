"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "@/components/ui/toast";
import { useCart } from "@/components/providers/CartProvider";
import { ChevronLeft, ChevronRight, ShoppingCart, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Product, ProductReview, ReviewMedia } from "@/types/model.types";
import { MediaType, ProductStatus } from "@/types/model.types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";

const FALLBACK_IMAGE = "/images/no-image.png";
const REVIEW_PAGE_SIZE = 5;
type ReviewFilter = "all" | 1 | 2 | 3 | 4 | 5;

function formatPrice(value: number) {
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

function ReviewStars({ rating, label }: { rating: number; label?: string }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={label}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} aria-hidden="true" className={`size-4 ${index < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
      ))}
    </span>
  );
}

function ReviewMediaItem({ media, index, t }: { media: ReviewMedia; index: number; t: (key: string, values?: Record<string, string | number>) => string }) {
  const isVideo = media.mediaType === MediaType.Video;
  const label = t(isVideo ? "reviewVideo" : "reviewImage", { index: index + 1 });

  if (isVideo) {
    return (
      <video
        src={media.mediaUrl}
        controls
        preload="metadata"
        aria-label={label}
        className="h-24 w-36 rounded-lg border bg-muted object-cover"
      />
    );
  }

  return (
    <a href={media.mediaUrl} target="_blank" rel="noreferrer" className="group relative block size-20 overflow-hidden rounded-lg border bg-muted" aria-label={label}>
      <Image src={media.mediaUrl} alt={label} fill className="object-cover transition-transform group-hover:scale-105" unoptimized />
    </a>
  );
}

function ReviewItem({ review, t }: { review: ProductReview; t: (key: string, values?: Record<string, string | number>) => string }) {
  const fullName = review.user?.profile?.fullName || t("anonymousReviewer");
  const initials = fullName.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase() || "?";

  return (
    <article className="border-b py-5 last:border-b-0">
      <div className="flex items-start gap-3">
        <Avatar size="lg">
          <AvatarImage src={review.user?.profile?.avatarUrl || undefined} alt={fullName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">{fullName}</h3>
            <time className="text-xs text-muted-foreground" dateTime={review.createdAt}>
              {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(review.createdAt))}
            </time>
          </div>
          <div className="mt-1"><ReviewStars rating={review.rating} label={t("reviewRating", { rating: review.rating })} /></div>
          {review.comment && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{review.comment}</p>}
          {review.medias?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {review.medias.map((media, index) => <ReviewMediaItem key={media.id} media={media} index={index} t={t} />)}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ProductDetail({ product, reviews }: { product: Product; reviews: ProductReview[] }) {
  const t = useTranslations("ProductDetail");
  const cartT = useTranslations("Cart");
  const { addItem } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("specifications");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [filterPages, setFilterPages] = useState<Record<string, number>>({ all: 0 });
  const images = useMemo(() => [...(product.images ?? [])].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder), [product.images]);
  const selectedImage = images[activeImage];
  const hasDiscount = product.discountPrice != null && product.discountPrice < product.originalPrice;
  const price = hasDiscount ? product.discountPrice! : product.originalPrice;
  const discountPercent = hasDiscount ? Math.round((1 - product.discountPrice! / product.originalPrice) * 100) : 0;
  const isPreOrder = product.status === ProductStatus.PreOrder;
  const isOutOfStock = product.status === ProductStatus.OutOfStock || product.stockQuantity <= 0;
  const canPurchase = !isOutOfStock || isPreOrder;
  const maxQuantity = Math.max(1, product.stockQuantity);
  const effectiveStatus = isPreOrder ? ProductStatus.PreOrder : isOutOfStock ? ProductStatus.OutOfStock : product.status;
  const updateQuantity = (value: number) => {
    if (!Number.isFinite(value)) return;
    setQuantity(Math.min(maxQuantity, Math.max(1, Math.floor(value))));
  };
  const statusLabels = {
    [ProductStatus.Pending]: t("pending"),
    [ProductStatus.InStock]: t("inStock"),
    [ProductStatus.LowStock]: t("lowStock"),
    [ProductStatus.OutOfStock]: t("outOfStock"),
    [ProductStatus.Hidden]: t("hidden"),
    [ProductStatus.PreOrder]: t("preOrder"),
    [ProductStatus.Deleted]: t("deleted"),
  };
  const visibleReviews = useMemo(() => reviews.filter((review) => review.rating >= 1 && review.rating <= 5), [reviews]);
  const ratingCounts = useMemo(() => [5, 4, 3, 2, 1].map((rating) => ({ rating, count: visibleReviews.filter((review) => review.rating === rating).length })), [visibleReviews]);
  const averageRating = visibleReviews.length
    ? visibleReviews.reduce((sum, review) => sum + review.rating, 0) / visibleReviews.length
    : product.averageRating ?? 0;
  const filteredReviews = reviewFilter === "all" ? visibleReviews : visibleReviews.filter((review) => review.rating === reviewFilter);
  const pageCount = Math.ceil(filteredReviews.length / REVIEW_PAGE_SIZE);
  const currentReviewPage = Math.min(filterPages[reviewFilter] ?? 0, Math.max(pageCount - 1, 0));
  const pageLinks = Array.from({ length: pageCount }, (_, index) => index);
  const pageReviews = filteredReviews.slice(currentReviewPage * REVIEW_PAGE_SIZE, (currentReviewPage + 1) * REVIEW_PAGE_SIZE);
  const changeReviewPage = (page: number) => {
    setFilterPages((pages) => ({ ...pages, [reviewFilter]: page }));
  };
  const tabItems = [
    { value: "specifications", label: t("specifications") },
    { value: "description", label: t("description") },
  ];
  const nextImage = (direction: number) => {
    if (!images.length) return;
    setActiveImage((current) => (current + direction + images.length) % images.length);
  };
  const handleAddToCart = async (selectedQuantity = quantity) => {
    setAddingToCart(true);
    const added = await addItem(product.id, selectedQuantity);
    setAddingToCart(false);
    toast.add({ title: added ? cartT("addSuccess") : cartT("addError"), type: added ? "success" : "error" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="min-w-0 lg:pt-2">
          <div className="relative mx-auto aspect-square w-110 max-w-lg overflow-hidden rounded-3xl border bg-card">
            <Image src={selectedImage?.imageUrl || FALLBACK_IMAGE} alt={selectedImage?.altText || product.productName} fill priority className="object-contain p-6 sm:p-10" unoptimized />
            {images.length > 1 && <>
              <Button variant="outline" size="icon" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90" aria-label={t("previousImage")} onClick={() => nextImage(-1)}><ChevronLeft /></Button>
              <Button variant="outline" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90" aria-label={t("nextImage")} onClick={() => nextImage(1)}><ChevronRight /></Button>
            </>}
          </div>
          {images.length > 1 && (
            <div className="mt-4 flex gap-3 justify-center overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button key={image.id} type="button" aria-label={t("selectImage", { index: index + 1 })} aria-pressed={activeImage === index} onClick={() => setActiveImage(index)} className={`relative size-20 shrink-0 overflow-hidden rounded-xl border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeImage === index ? "border-primary ring-2 ring-primary/30" : "border-border"}`}>
                  <Image src={image.imageUrl || FALLBACK_IMAGE} alt={image.altText || product.productName} fill className="object-contain p-2" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col lg:justify-around">
          <div className="flex flex-col gap-5 lg:justify-center">
            <div>
              <div className="space-y-5">
                <h1 className="text-xl font-bold tracking-tight md:text-2xl">{product.productName}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span>{t("sku", { sku: product.sku })}</span>
                  <a href="#reviews" className="inline-flex items-center gap-2 hover:text-foreground">
                    <ReviewStars rating={Math.round(averageRating)} label={t("reviewRating", { rating: averageRating.toFixed(1) })} />
                    <span>{averageRating.toFixed(1)} ({t("reviewCount", { count: visibleReviews.length })})</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <strong className="text-3xl font-bold text-primary">{formatPrice(price)}</strong>
              {hasDiscount && <>
                <del className="text-lg text-muted-foreground">{formatPrice(product.originalPrice)}</del>
                <Badge variant="destructive">-{discountPercent}%</Badge>
              </>}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={statusVariant(effectiveStatus)}>{statusLabels[effectiveStatus]}</Badge>
              <span className="text-sm text-muted-foreground">{t("stockCount", { count: product.stockQuantity })}</span>
            </div>

            <div className="space-y-2">
              <label htmlFor="product-quantity" className="text-sm font-medium">{t("quantity")}</label>
              <div className="flex w-fit items-center rounded-3xl border bg-background">
                <Button type="button" variant="ghost" size="icon" className="rounded-r-none" aria-label={t("decreaseQuantity")} disabled={!canPurchase || quantity <= 1} onClick={() => updateQuantity(quantity - 1)}>
                  <span aria-hidden="true" className="text-lg">−</span>
                </Button>
                <Input
                  id="product-quantity"
                  type="number"
                  min={1}
                  max={maxQuantity}
                  value={quantity}
                  disabled={!canPurchase}
                  onChange={(event) => updateQuantity(Number(event.target.value))}
                  className="h-10 w-16 rounded-none border-0 bg-transparent px-1 text-center shadow-none focus-visible:ring-0"
                />
                <Button type="button" variant="ghost" size="icon" className="rounded-l-none" aria-label={t("increaseQuantity")} disabled={!canPurchase || quantity >= maxQuantity} onClick={() => updateQuantity(quantity + 1)}>
                  <span aria-hidden="true" className="text-lg">+</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="pb-0">
            <Button size="lg" className="w-full" disabled={!canPurchase || addingToCart} onClick={() => void handleAddToCart()}><ShoppingCart />{addingToCart ? cartT("adding") : t("addToCart")}</Button>
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border bg-card p-5 sm:p-8">
        <Tabs items={tabItems} value={activeTab} onValueChange={setActiveTab}>
          {activeTab === "specifications" ? (
            product.specifications?.length ? (
              <Table>
                <TableBody>
                  {product.specifications.map((specification) => (
                    <TableRow key={specification.id}>
                      <TableCell className="w-1/3 whitespace-normal font-medium">{specification.specName}</TableCell>
                      <TableCell className="whitespace-normal">{specification.specValue}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-medium">{t("warranty")}</TableCell>
                    <TableCell>{t("warrantyMonths", { count: product.warrantyPeriod })}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : <p className="py-6 text-sm text-muted-foreground">{t("noSpecifications")}</p>
          ) : <p className="whitespace-pre-line py-4 text-sm leading-7 text-muted-foreground">{product.description || t("noDescription")}</p>}
        </Tabs>
      </section>

      <section id="reviews" className="mt-12 scroll-mt-24">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">{t("customerReviews")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("reviewsDescription")}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.6fr)]">
          <Card className="h-fit">
            <CardHeader><CardTitle>{t("ratingSummary")}</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-5 flex items-center gap-3">
                <span className="text-4xl font-bold">{averageRating.toFixed(1)}</span>
                <div><ReviewStars rating={Math.round(averageRating)} label={t("reviewRating", { rating: averageRating.toFixed(1) })} /><p className="mt-1 text-sm text-muted-foreground">{t("reviewCount", { count: visibleReviews.length })}</p></div>
              </div>
              <div className="space-y-3">
                {ratingCounts.map(({ rating, count }) => {
                  const percent = visibleReviews.length ? count / visibleReviews.length * 100 : 0;
                  return <div key={rating} className="grid grid-cols-[2rem_1fr_2.5rem] items-center gap-3">
                    <span className="text-sm">{rating}<Star aria-hidden="true" className="ml-1 inline size-3 fill-amber-400 text-amber-400" /></span>
                    <Progress value={percent} aria-label={t("ratingDistribution", { rating })} />
                    <span className="text-right text-xs text-muted-foreground">{count}</span>
                  </div>;
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 sm:pt-6">
              <div className="flex flex-wrap gap-2 border-b pb-4">
                {(["all", 5, 4, 3, 2, 1] as ReviewFilter[]).map((filter) => (
                  <Button key={filter} size="sm" variant={reviewFilter === filter ? "secondary" : "outline"} onClick={() => setReviewFilter(filter)}>
                    {filter === "all" ? t("allReviews") : <>{filter}<Star aria-hidden="true" className="size-3 fill-amber-400 text-amber-400" /></>}
                  </Button>
                ))}
              </div>
              {pageReviews.length ? pageReviews.map((review) => <ReviewItem key={review.id} review={review} t={t} />) : <p className="py-10 text-center text-sm text-muted-foreground">{t("noReviews")}</p>}
              {pageCount > 1 && <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem><PaginationPrevious href="#" text={t("previous")} aria-label={t("previousReviewsPage")} aria-disabled={currentReviewPage === 0} onClick={(event) => { event.preventDefault(); if (currentReviewPage > 0) changeReviewPage(currentReviewPage - 1); }} /></PaginationItem>
                  {pageLinks.map((page) => <PaginationItem key={page}><PaginationLink href={`?reviewsPage=${page + 1}`} isActive={page === currentReviewPage} onClick={(event) => { event.preventDefault(); changeReviewPage(page); }}>{page + 1}</PaginationLink></PaginationItem>)}
                  <PaginationItem><PaginationNext href="#" text={t("next")} aria-label={t("nextReviewsPage")} aria-disabled={currentReviewPage >= pageCount - 1} onClick={(event) => { event.preventDefault(); if (currentReviewPage < pageCount - 1) changeReviewPage(currentReviewPage + 1); }} /></PaginationItem>
                </PaginationContent>
              </Pagination>}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
