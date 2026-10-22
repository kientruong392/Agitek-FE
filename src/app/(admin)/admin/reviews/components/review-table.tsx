"use client";

import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpDown, Eye, Loader2, MessageSquareReply, MoreHorizontal, Search, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Cell, ColumnDef, Header, HeaderGroup, Row, SortingState } from "@tanstack/react-table";
import {
  columnFilteringFeature, columnVisibilityFeature, coreFeatures, createFilteredRowModel,
  createPaginatedRowModel, createSortedRowModel, flexRender, globalFilteringFeature,
  rowPaginationFeature, rowSortingFeature, tableFeatures, useTable,
} from "@tanstack/react-table";
import { replyReview } from "@/actions/review.action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { MediaType } from "@/types/model.types";
import type { ProductReview, ReviewMedia, ReviewUser } from "@/types/model.types";

const ALL = "all";
const REPLIED = "replied";
const UNREPLIED = "unreplied";
const FALLBACK_IMAGE = "/images/no-image.png";

const features = tableFeatures({
  ...coreFeatures,
  columnVisibilityFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

type Features = typeof features;
type ReplyFilter = typeof ALL | typeof REPLIED | typeof UNREPLIED;

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString(locale === "en" ? "en-US" : "vi-VN");
}

function getUserName(user: ReviewUser | null | undefined, fallback: string) {
  return user?.profile?.fullName || user?.username || fallback;
}

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase() || "?";
}

function ReviewStars({ rating, label }: { rating: number; label: string }) {
  return <span className="flex items-center gap-0.5" aria-label={label}>{Array.from({ length: 5 }, (_, index) => <Star key={index} aria-hidden="true" className={`size-3.5 ${index < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/35"}`} />)}</span>;
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground">{label}</p><div>{children}</div></div>;
}

function ReviewMediaItem({ media, index }: { media: ReviewMedia; index: number }) {
  const t = useTranslations("AdminReviews");
  const label = t("attachmentLabel", { index: index + 1 });
  if (media.mediaType === MediaType.Video) return <video src={media.mediaUrl} controls preload="metadata" aria-label={label} className="h-28 w-44 rounded-lg border bg-muted object-cover" />;
  return <a href={media.mediaUrl} target="_blank" rel="noreferrer" aria-label={label} className="group relative block size-28 overflow-hidden rounded-lg border bg-muted"><Image src={media.mediaUrl} alt={label} fill className="object-cover transition-transform group-hover:scale-105" unoptimized /></a>;
}

function Person({ user, fallback }: { user: ReviewUser | null | undefined; fallback: string }) {
  const name = getUserName(user, fallback);
  return <div className="flex min-w-0 items-center gap-3"><Avatar><AvatarImage src={user?.profile?.avatarUrl || undefined} alt={name} /><AvatarFallback>{getInitials(name)}</AvatarFallback></Avatar><div className="min-w-0"><p className="truncate font-medium">{name}</p>{user?.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}</div></div>;
}

function ReplyBadge({ review }: { review: ProductReview }) {
  const t = useTranslations("AdminReviews");
  return review.replyComment ? <Badge variant="default">{t("replied")}</Badge> : <Badge variant="secondary">{t("awaitingReply")}</Badge>;
}

function ReviewActionCell({ review, onUpdated }: { review: ProductReview; onUpdated: () => void }) {
  const t = useTranslations("AdminReviews");
  const locale = useLocale();
  const [detailOpen, setDetailOpen] = useState(false);
  const [replyComment, setReplyComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const product = review.product;
  const productImage = product?.images?.find((image) => image.isPrimary)?.imageUrl || product?.images?.[0]?.imageUrl || FALLBACK_IMAGE;
  const canReply = !review.replyComment && !review.replyUserId;

  function handleDetailOpenChange(nextOpen: boolean) {
    if (isSubmitting) return;
    setDetailOpen(nextOpen);
    if (nextOpen) setReplyComment("");
  }

  async function handleReply() {
    const normalizedReply = replyComment.trim();
    if (!normalizedReply) {
      toast.add({ title: t("replyRequired"), type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await replyReview(review.id, { replyComment: normalizedReply });
      if (!response.success) {
        toast.add({ title: response.message || t("replyFailed"), type: "error" });
        return;
      }
      toast.add({ title: t("replySuccess"), type: "success" });
      setDetailOpen(false);
      onUpdated();
    } finally {
      setIsSubmitting(false);
    }
  }

  return <>
    <DropdownMenu modal={false}><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={t("actionsLabel")} />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleDetailOpenChange(true)}><Eye />{t("viewDetails")}</DropdownMenuItem></DropdownMenuContent></DropdownMenu>

    <Dialog open={detailOpen} onOpenChange={handleDetailOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto sm:max-w-4xl">
        <DialogHeader><DialogTitle>{t("detailTitle", { id: review.id })}</DialogTitle><DialogDescription>{t("detailDescription")}</DialogDescription></DialogHeader>
        <div className="space-y-6">
          <section className="space-y-3"><h3 className="font-semibold">{t("productInformation")}</h3><div className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center"><div className="relative size-24 shrink-0 overflow-hidden rounded-xl border bg-muted"><Image src={productImage} alt={product?.productName || t("productFallback", { id: review.productId })} fill className="object-contain p-2" unoptimized /></div><div className="grid flex-1 gap-4 sm:grid-cols-3"><DetailField label={t("product")}><p className="font-medium">{product?.productName || t("productFallback", { id: review.productId })}</p></DetailField><DetailField label={t("sku")}><p className="font-mono text-sm">{product?.sku || "—"}</p></DetailField><DetailField label={t("productId")}><p>#{review.productId}</p></DetailField></div></div></section>

          <section className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">{t("customerReview")}</h3><ReplyBadge review={review} /></div><div className="rounded-xl border p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-start"><Person user={review.user} fallback={t("customerFallback", { id: review.userId })} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><ReviewStars rating={review.rating} label={t("ratingValue", { rating: review.rating })} /><time className="text-xs text-muted-foreground" dateTime={review.createdAt}>{formatDate(review.createdAt, locale)}</time></div>{review.comment && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{review.comment}</p>}<div className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><DetailField label={t("order")}>#{review.orderId}</DetailField><DetailField label={t("createdAt")}>{formatDate(review.createdAt, locale)}</DetailField><DetailField label={t("updatedAt")}>{formatDate(review.updatedAt, locale)}</DetailField></div>{review.medias.length > 0 && <div className="mt-4 space-y-2"><p className="text-sm font-medium">{t("attachments")}</p><div className="flex flex-wrap gap-3">{review.medias.map((media, index) => <ReviewMediaItem key={media.id} media={media} index={index} />)}</div></div>}</div></div></div></section>

          {canReply ? <section className="space-y-3 rounded-xl border bg-muted/20 p-4"><div><h3 className="font-semibold">{t("replyTitle")}</h3><p className="mt-1 text-sm text-muted-foreground">{t("replyDescription")}</p></div><div className="space-y-2"><label htmlFor={`admin-review-reply-${review.id}`} className="text-sm font-medium">{t("reply")}</label><Textarea id={`admin-review-reply-${review.id}`} value={replyComment} onChange={(event) => setReplyComment(event.target.value)} maxLength={1000} placeholder={t("replyPlaceholder")} className="min-h-28" disabled={isSubmitting} /><p className="text-right text-xs text-muted-foreground">{replyComment.length}/1000</p></div></section> : <section className="space-y-3 rounded-xl border bg-muted/20 p-4"><h3 className="font-semibold">{t("staffReply")}</h3><div className="flex flex-col gap-4 sm:flex-row sm:items-start"><Person user={review.replyUser} fallback={t("staffFallback")} /><div className="min-w-0 flex-1"><time className="text-xs text-muted-foreground" dateTime={review.replyCreatedAt || undefined}>{formatDate(review.replyCreatedAt, locale)}</time><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{review.replyComment || "—"}</p></div></div></section>}
        </div>
        <DialogFooter><Button variant="outline" disabled={isSubmitting} onClick={() => handleDetailOpenChange(false)}>{t("close")}</Button>{canReply && <Button disabled={isSubmitting} onClick={() => void handleReply()}>{isSubmitting && <Loader2 className="size-4 animate-spin" />}<MessageSquareReply className="size-4" />{t("sendReply")}</Button>}</DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}

function SortableHeader({ column, labelKey }: { column: { toggleSorting: (desc: boolean) => void; getIsSorted: () => false | "asc" | "desc" }; labelKey: "reviewer" | "product" | "rating" | "replyStatus" | "createdAt" }) {
  const t = useTranslations("AdminReviews");
  return <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>{t(labelKey)}<ArrowUpDown className="ml-1 size-3" /></Button>;
}

function ActionHeader() {
  const t = useTranslations("AdminReviews");
  return <span className="flex justify-end">{t("actions")}</span>;
}

function ProductCell({ review }: { review: ProductReview }) {
  const t = useTranslations("AdminReviews");
  const product = review.product;
  const image = product?.images?.find((item) => item.isPrimary)?.imageUrl || product?.images?.[0]?.imageUrl || FALLBACK_IMAGE;
  return <div className="flex min-w-52 items-center gap-3"><div className="relative size-11 shrink-0 overflow-hidden rounded-lg border bg-muted"><Image src={image} alt={product?.productName || t("productFallback", { id: review.productId })} fill className="object-contain p-1" unoptimized /></div><div className="min-w-0"><p className="line-clamp-2 font-medium">{product?.productName || t("productFallback", { id: review.productId })}</p><p className="truncate text-xs text-muted-foreground">{product?.sku || "—"}</p></div></div>;
}

function CreatedAtCell({ value }: { value: string }) {
  const locale = useLocale();
  return <span className="whitespace-nowrap text-sm">{formatDate(value, locale)}</span>;
}

function createColumns(onUpdated: () => void): ColumnDef<Features, ProductReview>[] {
  return [
    { id: "reviewer", accessorFn: (review) => `${review.user?.profile?.fullName ?? ""} ${review.user?.email ?? ""} ${review.userId}`, header: ({ column }) => <SortableHeader column={column} labelKey="reviewer" />, cell: ({ row }: { row: Row<Features, ProductReview> }) => <Person user={row.original.user} fallback={`#${row.original.userId}`} /> },
    { id: "product", accessorFn: (review) => `${review.product?.productName ?? ""} ${review.product?.sku ?? ""}`, header: ({ column }) => <SortableHeader column={column} labelKey="product" />, cell: ({ row }: { row: Row<Features, ProductReview> }) => <ProductCell review={row.original} /> },
    { id: "rating", accessorFn: (review) => review.rating, header: ({ column }) => <SortableHeader column={column} labelKey="rating" />, cell: ({ row }: { row: Row<Features, ProductReview> }) => <ReviewStars rating={row.original.rating} label={`${row.original.rating}`} /> },
    { id: "reply", accessorFn: (review) => review.replyComment ? 1 : 0, header: ({ column }) => <SortableHeader column={column} labelKey="replyStatus" />, cell: ({ row }: { row: Row<Features, ProductReview> }) => <ReplyBadge review={row.original} /> },
    { id: "createdAt", accessorFn: (review) => review.createdAt, header: ({ column }) => <SortableHeader column={column} labelKey="createdAt" />, cell: ({ row }: { row: Row<Features, ProductReview> }) => <CreatedAtCell value={row.original.createdAt} /> },
    { id: "actions", header: () => <ActionHeader />, cell: ({ row }: { row: Row<Features, ProductReview> }) => <ReviewActionCell review={row.original} onUpdated={onUpdated} /> },
  ];
}

export default function ReviewTable({ reviews, onUpdated }: { reviews: ProductReview[]; onUpdated: () => void }) {
  const t = useTranslations("AdminReviews");
  const [globalFilter, setGlobalFilter] = useState("");
  const [replyFilter, setReplyFilter] = useState<ReplyFilter>(ALL);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const columns = useMemo(() => createColumns(onUpdated), [onUpdated]);
  const filteredReviews = useMemo(() => reviews.filter((review) => replyFilter === ALL || (replyFilter === REPLIED ? Boolean(review.replyComment) : !review.replyComment)), [replyFilter, reviews]);
  const table = useTable({ features, data: filteredReviews, columns, autoResetPageIndex: false, state: { globalFilter, sorting, pagination }, onGlobalFilterChange: (value) => { setGlobalFilter(value); setPagination((current) => ({ ...current, pageIndex: 0 })); }, onSortingChange: setSorting, onPaginationChange: setPagination });

  function resetToFirstPage() {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }

  return <div className="flex flex-col gap-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={globalFilter} onChange={(event) => { setGlobalFilter(event.target.value); resetToFirstPage(); }} className="pl-9" placeholder={t("searchPlaceholder")} /></div><Select value={replyFilter} onValueChange={(value) => { setReplyFilter((value || ALL) as ReplyFilter); resetToFirstPage(); }}><SelectTrigger className="w-full lg:w-48"><SelectValue>{replyFilter === ALL ? t("allReplies") : replyFilter === REPLIED ? t("replied") : t("awaitingReply")}</SelectValue></SelectTrigger><SelectContent><SelectItem value={ALL}>{t("allReplies")}</SelectItem><SelectItem value={REPLIED}>{t("replied")}</SelectItem><SelectItem value={UNREPLIED}>{t("awaitingReply")}</SelectItem></SelectContent></Select><p className="text-sm text-muted-foreground lg:ml-auto">{t("reviewCount", { count: filteredReviews.length })}</p></div><div className="overflow-x-auto rounded-2xl border bg-card"><Table><TableHeader>{table.getHeaderGroups().map((headerGroup: HeaderGroup<Features, ProductReview>) => <TableRow key={headerGroup.id}>{headerGroup.headers.map((header: Header<Features, ProductReview, unknown>) => <TableHead key={header.id} className={header.id === "actions" ? "text-right" : ""}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.length ? table.getRowModel().rows.map((row: Row<Features, ProductReview>) => <TableRow key={row.id}>{row.getVisibleCells().map((cell: Cell<Features, ProductReview, unknown>) => <TableCell key={cell.id} className={cell.column.id === "actions" ? "text-right" : ""}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={6} className="h-28 text-center text-sm text-muted-foreground">{t("noResults")}</TableCell></TableRow>}</TableBody></Table></div>{table.getPageCount() > 1 && <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{t("page", { current: table.state.pagination.pageIndex + 1, total: table.getPageCount() })}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>{t("previous")}</Button><Button variant="outline" size="sm" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>{t("next")}</Button></div></div>}</div>;
}
