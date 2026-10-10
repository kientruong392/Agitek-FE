"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Upload, X, Loader2 } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { updateProduct } from "@/actions/product.action";
import { getAllBrands } from "@/actions/brand.action";
import { getAllCategories } from "@/actions/category.action";
import { uploadImageToCloudinary } from "@/actions/cloudinary.action";
import { productSchema, type ProductInput } from "@/schemas/product.schema";
import { getErrorMsg } from "@/utils/helper.utils";
import type { Product, ProductImage } from "@/types/model.types";

interface EditProductDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export default function EditProductDialog({ product, open, onOpenChange, onUpdated }: EditProductDialogProps) {
  const t = useTranslations("AdminProducts");
  
  // Existing images from DB
  const [existingImages, setExistingImages] = useState<ProductImage[]>(product.images || []);
  
  // New images to upload
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: brands = [] } = useQuery({
    queryKey: ["admin", "brands"],
    queryFn: async () => {
      const res = await getAllBrands();
      return res.success ? (res.data ?? []) : [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const res = await getAllCategories();
      return res.success ? (res.data ?? []) : [];
    },
  });

  const totalImages = existingImages.length + newImageFiles.length;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remainingSlots = 5 - totalImages;
    if (files.length > remainingSlots) {
      toast.add({ title: t("maxImagesError"), type: "error" });
    }

    const validFiles = files
      .slice(0, remainingSlots)
      .filter((file) => file.type.startsWith("image/"));

    if (validFiles.length < files.slice(0, remainingSlots).length) {
      toast.add({ title: t("invalidFileTypeError"), type: "error" });
    }

    setNewImageFiles((prev) => [...prev, ...validFiles]);
    
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setNewImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemoveExistingImage(index: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleRemoveNewImage(index: number) {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  const form = useForm({
    defaultValues: {
      productCode: product.sku,
      productName: product.productName,
      originalPrice: product.originalPrice,
      discountPrice: product.discountPrice ?? null,
      initialQuantity: product.initialQuantity, // Can't really change this without an API call, but we keep it for form completeness
      warrantyPeriod: product.warrantyPeriod,
      description: product.description || "",
      categoryId: product.categoryId,
      brandId: product.brandId,
    } as ProductInput,
    validators: { onSubmit: productSchema as any },
    onSubmit: async ({ value }) => {
      if (totalImages === 0) {
        toast.add({ title: t("imageRequired"), type: "error" });
        return;
      }
      
      const allImages: { imageUrl: string, sortOrder: number }[] = [];
      let sortOrder = 0;
      
      // Push existing first
      for (const img of existingImages) {
        allImages.push({ imageUrl: img.imageUrl, sortOrder: sortOrder++ });
      }

      // Upload new ones
      for (let i = 0; i < newImageFiles.length; i++) {
        const uploadRes = await uploadImageToCloudinary(newImageFiles[i], "agitek/products");
        if (!uploadRes.success || !uploadRes.data) {
          toast.add({ title: t(uploadRes.errorCode ?? "INTERNAL_SERVER_ERROR"), type: "error" });
          return;
        }
        allImages.push({ imageUrl: uploadRes.data.secure_url, sortOrder: sortOrder++ });
      }

      // We omit initialQuantity since UpdateProductDTO shouldn't update quantity (done via separate endpoints)
      // But we pass it if backend allows. Based on UpdateProductDTO, it doesn't have initialQuantity
      // I will just map properties safely.
      const res = await updateProduct(product.id, {
        productCode: value.productCode,
        productName: value.productName,
        originalPrice: value.originalPrice,
        discountPrice: value.discountPrice,
        warrantyPeriod: value.warrantyPeriod,
        description: value.description,
        categoryId: value.categoryId,
        brandId: value.brandId,
        images: allImages,
        specifications: product.specifications || [],
      });

      if (res.success) {
        toast.add({ title: t("editSuccess"), type: "success" });
        onOpenChange(false);
        onUpdated();
      } else {
        toast.add({ title: t(res.errorCode ?? "INTERNAL_SERVER_ERROR"), type: "error" });
      }
    },
  });

  return (
    <form.Subscribe selector={(state) => [state.isSubmitting]}>
      {([isSubmitting]) => (
        <Dialog open={open} onOpenChange={(val) => { if (!isSubmitting) onOpenChange(val); }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("editProductTitle")}</DialogTitle>
              <DialogDescription>{t("editProductDescription")}</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await form.handleSubmit();
              }}
              className="flex flex-col gap-4"
            >
              <fieldset disabled={isSubmitting} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="col-span-1 md:col-span-2">
                  <form.Field name="productName">
                    {(field) => (
                      <Field>
                        <FieldLabel>{t("name")}</FieldLabel>
                        <Input
                          id="edit-product-name"
                          placeholder={t("namePlaceholder")}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldError errors={field.state.meta.errors.map((error) => ({
                          message: getErrorMsg(typeof error === "string" ? error : (error as any)?.message, t) ?? undefined,
                        }))} />
                      </Field>
                    )}
                  </form.Field>
                </div>

                <form.Field name="productCode">
                  {(field) => (
                    <Field>
                      <FieldLabel>{t("code")}</FieldLabel>
                      <Input
                        id="edit-product-code"
                        placeholder={t("codePlaceholder")}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      <FieldError errors={field.state.meta.errors.map((error) => ({
                        message: getErrorMsg(typeof error === "string" ? error : error?.message, t) ?? undefined,
                      }))} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="initialQuantity">
                  {(field) => (
                    <Field>
                      <FieldLabel>{t("initialQuantity")} (Readonly)</FieldLabel>
                      <Input
                        id="edit-product-quantity"
                        type="number"
                        min="1"
                        disabled
                        value={field.state.value}
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Cập nhật số lượng qua chức năng Quản lý kho</p>
                    </Field>
                  )}
                </form.Field>

                <form.Field name="originalPrice">
                  {(field) => (
                    <Field>
                      <FieldLabel>{t("originalPrice")}</FieldLabel>
                      <Input
                        id="edit-product-price"
                        type="number"
                        min="0"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(parseFloat(e.target.value))}
                      />
                      <FieldError errors={field.state.meta.errors.map((error) => ({
                        message: getErrorMsg(typeof error === "string" ? error : error?.message, t) ?? undefined,
                      }))} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="discountPrice">
                  {(field) => (
                    <Field>
                      <FieldLabel>{t("discountPrice")}</FieldLabel>
                      <Input
                        id="edit-product-discount-price"
                        type="number"
                        min="0"
                        value={field.state.value ?? ""}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                          const val = e.target.value ? parseFloat(e.target.value) : null;
                          field.handleChange(val);
                        }}
                      />
                      <FieldError errors={field.state.meta.errors.map((error) => ({
                        message: getErrorMsg(typeof error === "string" ? error : error?.message, t) ?? undefined,
                      }))} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="categoryId">
                  {(field) => (
                    <Field>
                      <FieldLabel>{t("category")}</FieldLabel>
                      <Select value={String(field.state.value)} onValueChange={(val) => field.handleChange(val ? parseInt(val) : 0)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("categoryPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.categoryName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={field.state.meta.errors.map((error) => ({
                        message: getErrorMsg(typeof error === "string" ? error : error?.message, t) ?? undefined,
                      }))} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="brandId">
                  {(field) => (
                    <Field>
                      <FieldLabel>{t("brand")}</FieldLabel>
                      <Select value={String(field.state.value)} onValueChange={(val) => field.handleChange(val ? parseInt(val) : 0)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("brandPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map((b) => (
                            <SelectItem key={b.id} value={String(b.id)}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={field.state.meta.errors.map((error) => ({
                        message: getErrorMsg(typeof error === "string" ? error : error?.message, t) ?? undefined,
                      }))} />
                    </Field>
                  )}
                </form.Field>
                
                <form.Field name="warrantyPeriod">
                  {(field) => (
                    <Field>
                      <FieldLabel>{t("warranty")}</FieldLabel>
                      <Input
                        id="edit-product-warranty"
                        type="number"
                        min="0"
                        placeholder="Tháng"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(parseInt(e.target.value))}
                      />
                      <FieldError errors={field.state.meta.errors.map((error) => ({
                        message: getErrorMsg(typeof error === "string" ? error : error?.message, t) ?? undefined,
                      }))} />
                    </Field>
                  )}
                </form.Field>

                <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
                  <FieldLabel>{t("imagesLabel")} ({totalImages}/5)</FieldLabel>
                  <div
                    className="relative flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-4 transition-colors hover:border-primary/50 hover:bg-muted/50"
                    onClick={() => {
                      if (totalImages < 5) fileInputRef.current?.click();
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="size-6" />
                      <span className="text-sm">{t("uploadImagesHint")}</span>
                    </div>
                  </div>
                  
                  {totalImages > 0 && (
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2">
                      {existingImages.map((img, idx) => (
                        <div key={`exist-${img.id}`} className="relative overflow-hidden rounded-xl border bg-muted aspect-square flex items-center justify-center">
                          <Image
                            src={img.imageUrl}
                            alt={`Preview ${idx}`}
                            width={100}
                            height={100}
                            className="size-full object-cover"
                            unoptimized
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="absolute right-1 top-1 bg-background/50 hover:bg-background/80"
                            onClick={(e) => { e.stopPropagation(); handleRemoveExistingImage(idx); }}
                          >
                            <X className="size-3" />
                          </Button>
                          {idx === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[10px] font-bold text-center py-0.5">
                              Ảnh cũ
                            </span>
                          )}
                        </div>
                      ))}
                      {newImagePreviews.map((preview, idx) => (
                        <div key={`new-${idx}`} className="relative overflow-hidden rounded-xl border bg-muted aspect-square flex items-center justify-center">
                          <Image
                            src={preview}
                            alt={`New Preview ${idx}`}
                            width={100}
                            height={100}
                            className="size-full object-cover"
                            unoptimized
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="absolute right-1 top-1 bg-background/50 hover:bg-background/80"
                            onClick={(e) => { e.stopPropagation(); handleRemoveNewImage(idx); }}
                          >
                            <X className="size-3" />
                          </Button>
                          <span className="absolute bottom-0 left-0 right-0 bg-emerald-500/80 text-white text-[10px] font-bold text-center py-0.5">
                            Ảnh mới
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </fieldset>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {t("confirm")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </form.Subscribe>
  );
}
