"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Plus, Upload, X, Loader2 } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { createProduct } from "@/actions/product.action";
import { getAllBrands } from "@/actions/brand.action";
import { getAllCategories } from "@/actions/category.action";
import { uploadImageToCloudinary } from "@/actions/cloudinary.action";
import { productSchema, type ProductInput } from "@/schemas/product.schema";
import { getErrorMsg } from "@/utils/helper.utils";

interface AddProductDialogProps {
  onCreated: () => void;
}

export default function AddProductDialog({ onCreated }: AddProductDialogProps) {
  const t = useTranslations("AdminProducts");
  const [open, setOpen] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remainingSlots = 5 - imageFiles.length;
    if (files.length > remainingSlots) {
      toast.add({ title: t("maxImagesError"), type: "error" });
    }

    const validFiles = files
      .slice(0, remainingSlots)
      .filter((file) => file.type.startsWith("image/"));

    if (validFiles.length < files.slice(0, remainingSlots).length) {
      toast.add({ title: t("invalidFileTypeError"), type: "error" });
    }

    setImageFiles((prev) => [...prev, ...validFiles]);
    
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemoveImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  const form = useForm({
    defaultValues: {
      productCode: "",
      productName: "",
      originalPrice: 0,
      discountPrice: null,
      initialQuantity: 1,
      warrantyPeriod: 0,
      description: "",
      categoryId: 0,
      brandId: 0,
    } as ProductInput,
    validators: { onSubmit: productSchema as any },
    onSubmit: async ({ value }) => {
      if (imageFiles.length === 0) {
        toast.add({ title: t("imageRequired"), type: "error" });
        return;
      }
      
      const uploadedImages = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const uploadRes = await uploadImageToCloudinary(imageFiles[i], "agitek/products");
        if (!uploadRes.success || !uploadRes.data) {
          toast.add({ title: t(uploadRes.errorCode ?? "INTERNAL_SERVER_ERROR"), type: "error" });
          return;
        }
        uploadedImages.push({
          imageUrl: uploadRes.data.secure_url,
          sortOrder: i,
        });
      }

      const res = await createProduct({
        ...value,
        images: uploadedImages,
        specifications: [],
      });

      if (res.success) {
        toast.add({ title: t("createSuccess"), type: "success" });
        form.reset();
        setImageFiles([]);
        setImagePreviews([]);
        setOpen(false);
        onCreated();
      } else {
        toast.add({ title: t(res.errorCode ?? "INTERNAL_SERVER_ERROR"), type: "error" });
      }
    },
  });

  return (
    <form.Subscribe selector={(state) => [state.isSubmitting]}>
      {([isSubmitting]) => (
        <Dialog open={open} onOpenChange={(val) => { if (!isSubmitting) { setOpen(val); if (!val) { form.reset(); setImageFiles([]); setImagePreviews([]); } } }}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus data-icon="inline-start" />
            {t("addProduct")}
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("addProductTitle")}</DialogTitle>
              <DialogDescription>{t("addProductDescription")}</DialogDescription>
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
                          id="product-name"
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
                        id="product-code"
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
                      <FieldLabel>{t("initialQuantity")}</FieldLabel>
                      <Input
                        id="product-quantity"
                        type="number"
                        min="1"
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

                <form.Field name="originalPrice">
                  {(field) => (
                    <Field>
                      <FieldLabel>{t("originalPrice")}</FieldLabel>
                      <Input
                        id="product-price"
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
                        id="product-discount-price"
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
                        id="product-warranty"
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
                  <FieldLabel>{t("imagesLabel")} ({imageFiles.length}/5)</FieldLabel>
                  <div
                    className="relative flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-4 transition-colors hover:border-primary/50 hover:bg-muted/50"
                    onClick={() => {
                      if (imageFiles.length < 5) fileInputRef.current?.click();
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
                  {imagePreviews.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2">
                      {imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative overflow-hidden rounded-xl border bg-muted aspect-square flex items-center justify-center">
                          <Image
                            src={preview}
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
                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }}
                          >
                            <X className="size-3" />
                          </Button>
                          {idx === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[10px] font-bold text-center py-0.5">
                              Ảnh chính
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </fieldset>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setOpen(false); form.reset(); setImageFiles([]); setImagePreviews([]); }} disabled={isSubmitting}>
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
