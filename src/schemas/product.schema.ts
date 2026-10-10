import { z } from "zod";

export const productSchema = z.object({
  productCode: z
    .string()
    .trim()
    .min(1, { message: "codeRequired" })
    .max(16, { message: "codeMaxLength" }),
  productName: z
    .string()
    .trim()
    .min(1, { message: "nameRequired" })
    .max(100, { message: "nameMaxLength" }),
  originalPrice: z.coerce
    .number({ message: "originalPriceRequired" })
    .min(0, { message: "originalPriceMin" }),
  discountPrice: z.coerce.number().min(0).nullable().optional(),
  initialQuantity: z.coerce
    .number({ message: "initialQuantityRequired" })
    .int()
    .min(1, { message: "initialQuantityMin" }),
  description: z.string().nullable().optional(),
  warrantyPeriod: z.coerce
    .number({ message: "warrantyPeriodRequired" })
    .int()
    .min(0, { message: "warrantyPeriodMin" }),
  categoryId: z.coerce.number().int().min(1, { message: "categoryRequired" }),
  brandId: z.coerce.number().int().min(1, { message: "brandRequired" }),
});

export type ProductInput = z.infer<typeof productSchema>;
