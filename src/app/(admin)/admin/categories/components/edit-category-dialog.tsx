"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { updateCategory } from "@/actions/category.action";
import { categorySchema, type CategoryInput } from "@/schemas/category.schema";
import { getErrorMsg } from "@/utils/helper.utils";
import type { Category } from "@/types/model.types";

interface EditCategoryDialogProps {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export default function EditCategoryDialog({ category, open, onOpenChange, onUpdated }: EditCategoryDialogProps) {
  const t = useTranslations("AdminCategories");

  const form = useForm({
    defaultValues: {
      code: category?.code ?? "",
      categoryName: category?.categoryName ?? "",
      parentCategoryId: category?.parentCategoryId ?? null,
    } as CategoryInput,
    validators: { onSubmit: categorySchema },
    onSubmit: async ({ value }) => {
      if (!category) return;
      const res = await updateCategory(category.id, {
        code: value.code,
        categoryName: value.categoryName,
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

  useEffect(() => {
    if (category && open) {
      form.reset();
      form.setFieldValue("code", category.code);
      form.setFieldValue("categoryName", category.categoryName);
      form.setFieldValue("parentCategoryId", category.parentCategoryId ?? null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, open]);

  if (!category) return null;

  return (
    <form.Subscribe selector={(state) => [state.isSubmitting]}>
      {([isSubmitting]) => (
        <Dialog open={open} onOpenChange={(val) => { if (!isSubmitting) onOpenChange(val); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editCategoryTitle")}</DialogTitle>
          <DialogDescription>{t("editCategoryDescription")}</DialogDescription>
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
                    id="edit-category-code"
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

            <form.Field name="categoryName">
              {(field) => (
                <Field>
                  <FieldLabel>{t("name")}</FieldLabel>
                  <Input
                    id="edit-category-name"
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
