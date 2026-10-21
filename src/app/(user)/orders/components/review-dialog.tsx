"use client";

import Image from "next/image";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { ImageIcon, Loader2, Star, Upload, Video, X } from "lucide-react";
import { createReview } from "@/actions/review.action";
import { uploadMediaToCloudinary } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import type { Order, OrderDetail } from "@/types/model.types";

const FALLBACK_IMAGE = "/images/no-image.png";
const MAX_MEDIA_FILES = 5;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_TOTAL_MEDIA_SIZE_BYTES = 100 * 1024 * 1024;

interface PendingMedia {
  id: string;
  file: File;
  previewUrl: string;
  isVideo: boolean;
}

interface ReviewDialogProps {
  order: Order;
  item: OrderDetail;
  onSubmitted: (reviewId: number) => void;
}

export default function ReviewDialog({ order, item, onSubmitted }: ReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [medias, setMedias] = useState<PendingMedia[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef(new Set<string>());

  function resetForm() {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current.clear();
    setRating(0);
    setComment("");
    setMedias([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  useEffect(() => () => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) return;
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const remainingSlots = MAX_MEDIA_FILES - medias.length;
    const selectedSize = medias.reduce((total, media) => total + media.file.size, 0);
    let acceptedSize = selectedSize;
    let exceedsFileLimit = false;
    let exceedsTotalLimit = false;
    let hasUnsupportedFile = false;
    let exceedsSlotLimit = false;
    const acceptedFiles: File[] = [];

    for (const file of files) {
      if (acceptedFiles.length >= remainingSlots) {
        exceedsSlotLimit = true;
        continue;
      }

      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isImage && !isVideo) {
        hasUnsupportedFile = true;
        continue;
      }

      if (file.size > (isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES)) {
        exceedsFileLimit = true;
        continue;
      }

      if (acceptedSize + file.size > MAX_TOTAL_MEDIA_SIZE_BYTES) {
        exceedsTotalLimit = true;
        continue;
      }

      acceptedFiles.push(file);
      acceptedSize += file.size;
    }

    if (exceedsSlotLimit) {
      toast.add({ title: `Chỉ có thể đính kèm tối đa ${MAX_MEDIA_FILES} ảnh hoặc video.`, type: "error" });
    }
    if (hasUnsupportedFile) {
      toast.add({ title: "Chỉ hỗ trợ định dạng ảnh hoặc video.", type: "error" });
    }
    if (exceedsFileLimit) {
      toast.add({ title: "Ảnh tối đa 10 MB, video tối đa 50 MB.", type: "error" });
    }
    if (exceedsTotalLimit) {
      toast.add({ title: "Tổng dung lượng tệp đính kèm không được vượt quá 100 MB.", type: "error" });
    }

    const newMedias = acceptedFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);
      return {
        id: crypto.randomUUID(),
        file,
        previewUrl,
        isVideo: file.type.startsWith("video/"),
      };
    });

    setMedias((current) => [...current, ...newMedias]);
    event.target.value = "";
  }

  function removeMedia(media: PendingMedia) {
    URL.revokeObjectURL(media.previewUrl);
    previewUrlsRef.current.delete(media.previewUrl);
    setMedias((current) => current.filter((item) => item.id !== media.id));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rating) {
      toast.add({ title: "Vui lòng chọn số sao đánh giá.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedMedias: { mediaUrl: string }[] = [];
      for (const media of medias) {
        const response = await uploadMediaToCloudinary(media.file, "agitek/reviews");
        if (!response.success || !response.data?.secure_url) {
          toast.add({ title: response.message || "Không thể tải tệp lên.", type: "error" });
          return;
        }
        uploadedMedias.push({ mediaUrl: response.data.secure_url });
      }

      const response = await createReview({
        orderId: order.id,
        productId: item.productId,
        rating,
        comment: comment.trim() || undefined,
        medias: uploadedMedias,
      });
      if (!response.success || !response.data) {
        toast.add({ title: response.message || "Không thể gửi đánh giá.", type: "error" });
        return;
      }

      toast.add({ title: "Đánh giá của bạn đã được gửi.", type: "success" });
      resetForm();
      setOpen(false);
      onSubmitted(response.data.id);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        <Star className="size-4" />
        Đánh giá
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đánh giá sản phẩm</DialogTitle>
          <DialogDescription>Chia sẻ trải nghiệm của bạn về sản phẩm đã nhận.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-3 rounded-2xl border bg-muted/30 p-3">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border bg-background">
              <Image
                src={item.productImageUrl || FALLBACK_IMAGE}
                alt={item.productName}
                fill
                className="object-contain p-1"
                unoptimized
              />
            </div>
            <p className="line-clamp-2 font-medium">{item.productName || `Sản phẩm #${item.productId}`}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Chất lượng sản phẩm</p>
            <div className="flex gap-1" role="radiogroup" aria-label="Số sao đánh giá">
              {Array.from({ length: 5 }, (_, index) => index + 1).map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10 rounded-full"
                  aria-label={`${value} sao`}
                  aria-checked={rating === value}
                  role="radio"
                  onClick={() => setRating(value)}
                >
                  <Star className={`size-7 transition-colors ${value <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/50"}`} />
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor={`review-comment-${order.id}-${item.productId}`} className="text-sm font-medium">Nhận xét</label>
            <Textarea
              id={`review-comment-${order.id}-${item.productId}`}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Sản phẩm có đáp ứng mong đợi của bạn không?"
              maxLength={1000}
              className="min-h-28"
            />
            <p className="text-right text-xs text-muted-foreground">{comment.length}/1000</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Ảnh hoặc video</p>
                <p className="text-xs text-muted-foreground">Tối đa {MAX_MEDIA_FILES} tệp · ảnh 10 MB, video 50 MB</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={medias.length >= MAX_MEDIA_FILES || isSubmitting}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-4" />
                Chọn tệp
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFiles}
              />
            </div>

            {medias.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {medias.map((media) => (
                  <div key={media.id} className="group relative aspect-square overflow-hidden rounded-xl border bg-muted">
                    {media.isVideo ? (
                      <video src={media.previewUrl} controls className="size-full object-cover" />
                    ) : (
                      <Image src={media.previewUrl} alt="Tệp đính kèm đánh giá" fill className="object-cover" unoptimized />
                    )}
                    <div className="absolute left-2 top-2 rounded-full bg-background/90 p-1.5 text-muted-foreground shadow-sm">
                      {media.isVideo ? <Video className="size-3.5" /> : <ImageIcon className="size-3.5" />}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-xs"
                      className="absolute right-2 top-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label="Xóa tệp đính kèm"
                      disabled={isSubmitting}
                      onClick={() => removeMedia(media)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => handleOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Gửi đánh giá
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
