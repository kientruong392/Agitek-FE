import { z } from "zod";

export const voucherSchema = z.object({
  code: z.string().trim().max(50, { message: "codeMaxLength" }).optional(),
  name: z.string().trim().min(1, { message: "nameRequired" }).max(100, { message: "nameMaxLength" }),
  description: z.string().max(500, { message: "descriptionMaxLength" }).nullable().optional(),
  discountType: z.coerce.number(),
  discountValue: z.coerce.number().min(0, { message: "discountValueMin" }),
  maxDiscountValue: z.coerce.number().min(0).nullable().optional(),
  minOrderValue: z.coerce.number().min(0, { message: "minOrderValueMin" }),
  initialQuantity: z.coerce.number().int().min(1, { message: "initialQuantityMin" }).max(9999, { message: "initialQuantityMax" }),
  startDate: z.string().min(1, { message: "startDateRequired" }),
  endDate: z.string().min(1, { message: "endDateRequired" }),
  status: z.coerce.number(),
});

export type VoucherInput = z.infer<typeof voucherSchema>;

export const updateVoucherSchema = z.object({
  name: z.string().trim().max(100, { message: "nameMaxLength" }).optional(),
  description: z.string().max(500, { message: "descriptionMaxLength" }).nullable().optional(),
  quantity: z.coerce.number().int().min(1, { message: "quantityMin" }).max(9999, { message: "quantityMax" }).optional(),
  endDate: z.string().optional(),
  status: z.coerce.number().optional(),
});

export type UpdateVoucherInput = z.infer<typeof updateVoucherSchema>;
