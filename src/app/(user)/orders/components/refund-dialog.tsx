"use client";

import Image from "next/image";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { ImageIcon, Loader2, RotateCcw, Upload, Video, X } from "lucide-react";
import { createRefund } from "@/actions/refund.action";
import { uploadMediaToCloudinary } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import type { Order, OrderDetail, RefundStatus } from "@/types/model.types";

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

interface RefundDialogProps {
  order: Order;
  item: OrderDetail;
  onSubmitted: (status: RefundStatus) => void;
}

export default function RefundDialog({ order, item, onSubmitted }: RefundDialogProps) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [medias, setMedias] = useState<PendingMedia[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef(new Set<string>());

  function resetForm() {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current.clear();
    setQuantity(1);
    setReason("");
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
    let acceptedSize = medias.reduce((total, media) => total + media.file.size, 0);
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

    if (exceedsSlotLimit) toast.add({ title: `Chỉ có thể đính kèm tối đa ${MAX_MEDIA_FILES} ảnh hoặc video.`, type: "error" });
    if (hasUnsupportedFile) toast.add({ title: "Chỉ hỗ trợ định dạng ảnh hoặc video.", type: "error" });
    if (exceedsFileLimit) toast.add({ title: "Ảnh tối đa 10 MB, video tối đa 50 MB.", type: "error" });
    if (exceedsTotalLimit) toast.add({ title: "Tổng dung lượng tệp đính kèm không được vượt quá 100 MB.", type: "error" });

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
    if (!reason.trim()) {
      toast.add({ title: "Vui lòng nhập lý do yêu cầu hoàn tiền.", type: "error" });
      return;
    }
    if (!medias.length) {
      toast.add({ title: "Vui lòng đính kèm ít nhất một ảnh hoặc video liên quan.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedMedias: { mediaUrl: string }[] = [];
      for (const media of medias) {
        const response = await uploadMediaToCloudinary(media.file, "agitek/refunds");
        if (!response.success || !response.data?.secure_url) {
          toast.add({ title: response.message || "Không thể tải tệp lên.", type: "error" });
          return;
        }
        uploadedMedias.push({ mediaUrl: response.data.secure_url });
      }

      const response = await createRefund({
        orderId: order.id,
        productId: item.productId,
        quantity,
        reason: reason.trim(),
        medias: uploadedMedias,
      });
      if (!response.success || !response.data) {
        toast.add({ title: response.message || "Không thể gửi yêu cầu hoàn tiền.", type: "error" });
        return;
      }

      toast.add({ title: "Yêu cầu hoàn tiền đã được gửi.", type: "success" });
      resetForm();
      setOpen(false);
      onSubmitted(response.data.status);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        <RotateCcw className="size-4" />
        Trả hàng/hoàn tiền
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yêu cầu trả hàng/hoàn tiền</DialogTitle>
          <DialogDescription>Hãy cho chúng tôi biết vấn đề bạn gặp phải và cung cấp bằng chứng liên quan.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-3 rounded-2xl border bg-muted/30 p-3">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border bg-background">
              <Image src={item.productImageUrl || FALLBACK_IMAGE} alt={item.productName} fill className="object-contain p-1" unoptimized />
            </div>
            <div className="min-w-0"><p className="line-clamp-2 font-medium">{item.productName || `Sản phẩm #${item.productId}`}</p><p className="mt-1 text-sm text-muted-foreground">Đã mua: {item.quantity} sản phẩm</p></div>
          </div>

          <div className="space-y-2">
            <label htmlFor={`refund-quantity-${order.id}-${item.productId}`} className="text-sm font-medium">Số lượng yêu cầu hoàn tiền</label>
            <Input id={`refund-quantity-${order.id}-${item.productId}`} type="number" min={1} max={item.quantity} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(item.quantity, Number(event.target.value) || 1)))} disabled={isSubmitting} />
          </div>

          <div className="space-y-2">
            <label htmlFor={`refund-reason-${order.id}-${item.productId}`} className="text-sm font-medium">Lý do yêu cầu</label>
            <Textarea id={`refund-reason-${order.id}-${item.productId}`} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Mô tả tình trạng sản phẩm hoặc vấn đề bạn gặp phải" maxLength={500} required disabled={isSubmitting} className="min-h-28" />
            <p className="text-right text-xs text-muted-foreground">{reason.length}/500</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-sm font-medium">Ảnh hoặc video liên quan</p><p className="text-xs text-muted-foreground">Bắt buộc, tối đa {MAX_MEDIA_FILES} tệp · ảnh 10 MB, video 50 MB</p></div>
              <Button type="button" variant="outline" size="sm" disabled={medias.length >= MAX_MEDIA_FILES || isSubmitting} onClick={() => fileInputRef.current?.click()}><Upload className="size-4" />Chọn tệp</Button>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFiles} />
            </div>

            {medias.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {medias.map((media) => <div key={media.id} className="group relative aspect-square overflow-hidden rounded-xl border bg-muted">
                {media.isVideo ? <video src={media.previewUrl} controls className="size-full object-cover" /> : <Image src={media.previewUrl} alt="Tệp đính kèm hoàn tiền" fill className="object-cover" unoptimized />}
                <div className="absolute left-2 top-2 rounded-full bg-background/90 p-1.5 text-muted-foreground shadow-sm">{media.isVideo ? <Video className="size-3.5" /> : <ImageIcon className="size-3.5" />}</div>
                <Button type="button" variant="destructive" size="icon-xs" className="absolute right-2 top-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100" aria-label="Xóa tệp đính kèm" disabled={isSubmitting} onClick={() => removeMedia(media)}><X className="size-3.5" /></Button>
              </div>)}
            </div>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => handleOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="size-4 animate-spin" />}Gửi yêu cầu</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
