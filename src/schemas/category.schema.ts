import { z } from "zod";

export const categorySchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, { message: "codeRequired" })
    .min(3, { message: "codeMinLength" })
    .max(6, { message: "codeMaxLength" }),
  categoryName: z
    .string()
    .trim()
    .min(1, { message: "nameRequired" })
    .max(50, { message: "nameMaxLength" }),
  parentCategoryId: z.number().nullable().optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
