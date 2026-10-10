"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { createCategory, getAllCategoriesWithSub } from "@/actions/category.action";
import { categorySchema, type CategoryInput } from "@/schemas/category.schema";
import { getErrorMsg } from "@/utils/helper.utils";
import type { Category } from "@/types/model.types";

interface AddCategoryDialogProps {
  onCreated: () => void;
}

export default function AddCategoryDialog({ onCreated }: AddCategoryDialogProps) {
  const t = useTranslations("AdminCategories");
  const [open, setOpen] = useState(false);

  const { data: allCategories } = useQuery({
    queryKey: ["admin", "categories", "flat"],
    queryFn: async () => {
      const res = await getAllCategoriesWithSub();
      return res.success ? (res.data ?? []) : [];
    },
    enabled: open,
  });

  function flattenCategories(categories: Category[], depth = 0): { id: number; label: string }[] {
    const result: { id: number; label: string }[] = [];
    for (const cat of categories) {
      result.push({ id: cat.id, label: `${"— ".repeat(depth)}${cat.categoryName}` });
      if (cat.subCategories?.length) {
        result.push(...flattenCategories(cat.subCategories, depth + 1));
      }
    }
    return result;
  }

  const categoryOptions = allCategories ? Array.from(
    new Map(flattenCategories(allCategories).map(item => [item.id, item])).values()
  ) : [];

  const form = useForm({
    defaultValues: {
      code: "",
      categoryName: "",
      parentCategoryId: null,
    } as CategoryInput,
    validators: { onSubmit: categorySchema },
    onSubmit: async ({ value }) => {
      const res = await createCategory(value);

      if (res.success) {
        toast.add({ title: t("createSuccess"), type: "success" });
        form.reset();
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
        <Dialog open={open} onOpenChange={(val) => { if (!isSubmitting) { setOpen(val); if (!val) form.reset(); } }}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus data-icon="inline-start" />
        {t("addCategory")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addCategoryTitle")}</DialogTitle>
          <DialogDescription>{t("addCategoryDescription")}</DialogDescription>
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
                  id="category-code"
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
                  id="category-name"
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

          <form.Field name="parentCategoryId">
            {(field) => (
              <Field>
                <FieldLabel>{t("parentCategory")}</FieldLabel>
                <Select
                  value={field.state.value ? String(field.state.value) : "none"}
                  onValueChange={(val) => field.handleChange(val === "none" ? null : Number(val))}
                >
                  <SelectTrigger id="parent-category" className="w-full">
                    <SelectValue placeholder={t("noParent")}>
                      {field.state.value
                        ? categoryOptions.find((opt) => opt.id === field.state.value)?.label ?? field.state.value
                        : t("noParent")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("noParent")}</SelectItem>
                    {categoryOptions.map((opt) => (
                      <SelectItem key={opt.id} value={String(opt.id)}>
                        {opt.label}
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
          </fieldset>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setOpen(false); form.reset(); }} disabled={isSubmitting}>
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
