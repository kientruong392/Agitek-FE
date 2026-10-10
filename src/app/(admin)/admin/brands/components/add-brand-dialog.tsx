"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Plus, Upload, X, Loader2 } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { createBrand } from "@/actions/brand.action";
import { uploadImageToCloudinary } from "@/actions/cloudinary.action";
import { brandSchema, type BrandInput } from "@/schemas/brand.schema";
import { getErrorMsg } from "@/utils/helper.utils";

interface AddBrandDialogProps {
  onCreated: () => void;
}

export default function AddBrandDialog({ onCreated }: AddBrandDialogProps) {
  const t = useTranslations("AdminBrands");
  const [open, setOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.add({ title: t("invalidFileType"), type: "error" });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const form = useForm({
    defaultValues: {
      code: "",
      name: "",
      logoUrl: null,
    } as BrandInput,
    validators: { onSubmit: brandSchema },
    onSubmit: async ({ value }) => {
      let logoUrl = value.logoUrl;

      if (imageFile) {
        const uploadRes = await uploadImageToCloudinary(imageFile, "agitek/brands");
        if (!uploadRes.success || !uploadRes.data) {
          toast.add({ title: t(uploadRes.errorCode ?? "INTERNAL_SERVER_ERROR"), type: "error" });
          return;
        }
        logoUrl = uploadRes.data.secure_url;
      }

      const res = await createBrand({
        ...value,
        logoUrl,
      });

      if (res.success) {
        toast.add({ title: t("createSuccess"), type: "success" });
        form.reset();
        handleRemoveImage();
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
        <Dialog open={open} onOpenChange={(val) => { if (!isSubmitting) { setOpen(val); if (!val) { form.reset(); handleRemoveImage(); } } }}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus data-icon="inline-start" />
        {t("addBrand")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addBrandTitle")}</DialogTitle>
          <DialogDescription>{t("addBrandDescription")}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await form.handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          <fieldset disabled={isSubmitting} className="flex flex-col gap-4">
          <form.Field name="code">
            {(field) => (
              <Field>
                <FieldLabel>{t("code")}</FieldLabel>
                <Input
                  id="brand-code"
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

          <form.Field name="name">
            {(field) => (
              <Field>
                <FieldLabel>{t("name")}</FieldLabel>
                <Input
                  id="brand-name"
                  placeholder={t("namePlaceholder")}
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

          <div className="flex flex-col gap-1.5">
            <FieldLabel>{t("logoLabel")}</FieldLabel>
            <div
              className="relative flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-4 transition-colors hover:border-primary/50 hover:bg-muted/50"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="size-6" />
                <span className="text-sm">{t("uploadHint")}</span>
              </div>
            </div>
            {imagePreview && (
              <div className="relative mt-2 overflow-hidden rounded-xl border bg-muted">
                <div className="flex items-center justify-center p-3">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={200}
                    height={200}
                    className="max-h-40 w-auto object-cover rounded-lg"
                    unoptimized
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-2 top-2"
                  onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                >
                  <X />
                </Button>
              </div>
            )}
          </div>
          </fieldset>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setOpen(false); form.reset(); handleRemoveImage(); }} disabled={isSubmitting}>
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
