"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Loader2 } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { createVoucher } from "@/actions/voucher.action";
import { voucherSchema, type VoucherInput } from "@/schemas/voucher.schema";
import { getErrorMsg } from "@/utils/helper.utils";
import { DiscountType, DiscountTypeLabels, VoucherStatus, VoucherStatusLabels } from "@/types/model.types";

interface AddVoucherDialogProps {
  onCreated: () => void;
}

export default function AddVoucherDialog({ onCreated }: AddVoucherDialogProps) {
  const t = useTranslations("AdminVouchers");
  const [open, setOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      code: "",
      name: "",
      description: "",
      discountType: DiscountType.Percentage,
      discountValue: 0,
      maxDiscountValue: null,
      minOrderValue: 0,
      initialQuantity: 1,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      status: VoucherStatus.Active,
    } as VoucherInput,
    validators: { onSubmit: voucherSchema as any },
    onSubmit: async ({ value }) => {
      const res = await createVoucher(value);

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
            {t("addVoucher")}
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("addVoucherTitle")}</DialogTitle>
              <DialogDescription>{t("addVoucherDescription")}</DialogDescription>
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
                  <form.Field name="name">
                    {(field) => (
                      <Field>
                        <FieldLabel>{t("name")}</FieldLabel>
                        <Input
                          id="voucher-name"
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

                <form.Field name="code">
                  {(field) => (
                    <Field>
                      <FieldLabel>{t("code")}</FieldLabel>
                      <Input
                        id="voucher-code"
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
                        id="voucher-quantity"
                        type="number"
                        min="1"
                        max="9999"
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

                <form.Field name="discountType">
                  {(field) => (
                    <Field>
                      <FieldLabel>{t("discountType")}</FieldLabel>
                      <Select value={String(field.state.value)} onValueChange={(val) => field.handleChange(Number(val))}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("discountTypePlaceholder")}>
                            {field.state.value !== undefined ? DiscountTypeLabels[field.state.value as DiscountType] : t("discountTypePlaceholder")}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={String(DiscountType.Percentage)}>{DiscountTypeLabels[DiscountType.Percentage]}</SelectItem>
                          <SelectItem value={String(DiscountType.FixedAmount)}>{DiscountTypeLabels[DiscountType.FixedAmount]}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError errors={field.state.meta.errors.map((error) => ({
                        message: getErrorMsg(typeof error === "string" ? error : error?.message, t) ?? undefined,
                      }))} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="discountValue">
                  {(field) => (
                    <Field>
                      <FieldLabel>{t("discountValue")}</FieldLabel>
                      <Input
                        id="voucher-discount-value"
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

                <form.Field name="maxDiscountValue">
                  {(field) => (
                    <Field>
                      <FieldLabel>{t("maxDiscountValue")}</FieldLabel>
                      <Input
                        id="voucher-max-discount-value"
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

                <form.Field name="minOrderValue">
                  {(field) => (
                    <Field>
                      <FieldLabel>{t("minOrderValue")}</FieldLabel>
                      <Input
                        id="voucher-min-order-value"
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

                <form.Field name="startDate">
                  {(field) => (
                    <Field>
                      <FieldLabel>{t("startDate")}</FieldLabel>
                      <Input
                        id="voucher-start-date"
                        type="datetime-local"
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

                <form.Field name="endDate">
                  {(field) => (
                    <Field>
                      <FieldLabel>{t("endDate")}</FieldLabel>
                      <Input
                        id="voucher-end-date"
                        type="datetime-local"
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

                <form.Field name="status">
                  {(field) => (
                    <Field>
                      <FieldLabel>{t("status")}</FieldLabel>
                      <Select value={String(field.state.value)} onValueChange={(val) => field.handleChange(Number(val))}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("statusPlaceholder")}>
                            {field.state.value !== undefined ? VoucherStatusLabels[field.state.value as VoucherStatus] : t("statusPlaceholder")}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={String(VoucherStatus.Active)}>{VoucherStatusLabels[VoucherStatus.Active]}</SelectItem>
                          <SelectItem value={String(VoucherStatus.Inactive)}>{VoucherStatusLabels[VoucherStatus.Inactive]}</SelectItem>
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
