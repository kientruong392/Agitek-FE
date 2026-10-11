"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { updateVoucher } from "@/actions/voucher.action";
import { updateVoucherSchema, type UpdateVoucherInput } from "@/schemas/voucher.schema";
import { getErrorMsg } from "@/utils/helper.utils";
import { VoucherStatus, VoucherStatusLabels } from "@/types/model.types";
import type { VoucherDTO } from "@/types/model.types";

interface EditVoucherDialogProps {
  voucher: VoucherDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export default function EditVoucherDialog({ voucher, open, onOpenChange, onUpdated }: EditVoucherDialogProps) {
  const t = useTranslations("AdminVouchers");

  const form = useForm({
    defaultValues: {
      name: voucher.name,
      description: voucher.description || "",
      quantity: voucher.quantity,
      endDate: new Date(voucher.endDate).toISOString().slice(0, 16),
      status: voucher.status,
    } as UpdateVoucherInput,
    validators: { onSubmit: updateVoucherSchema as any },
    onSubmit: async ({ value }) => {
      const res = await updateVoucher(voucher.id, {
        name: value.name,
        description: value.description,
        quantity: value.quantity,
        endDate: new Date(value.endDate!).toISOString(),
        status: value.status,
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
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("editVoucherTitle")}</DialogTitle>
              <DialogDescription>{t("editVoucherDescription")}</DialogDescription>
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
                          id="edit-voucher-name"
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

                <form.Field name="quantity">
                  {(field) => (
                    <Field>
                      <FieldLabel>{t("quantity")}</FieldLabel>
                      <Input
                        id="edit-voucher-quantity"
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

                <form.Field name="endDate">
                  {(field) => (
                    <Field>
                      <FieldLabel>{t("endDate")}</FieldLabel>
                      <Input
                        id="edit-voucher-end-date"
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
                          <SelectItem value={String(VoucherStatus.Expired)}>{VoucherStatusLabels[VoucherStatus.Expired]}</SelectItem>
                          <SelectItem value={String(VoucherStatus.LowStock)}>{VoucherStatusLabels[VoucherStatus.LowStock]}</SelectItem>
                          <SelectItem value={String(VoucherStatus.OutOfStock)}>{VoucherStatusLabels[VoucherStatus.OutOfStock]}</SelectItem>
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
