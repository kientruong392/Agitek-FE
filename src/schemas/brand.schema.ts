import { z } from "zod";

export const brandSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, { message: "codeRequired" })
    .min(3, { message: "codeMinLength" })
    .max(6, { message: "codeMaxLength" }),
  name: z
    .string()
    .trim()
    .min(1, { message: "nameRequired" })
    .max(50, { message: "nameMaxLength" }),
  logoUrl: z.string().nullable().optional(),
});

export type BrandInput = z.infer<typeof brandSchema>;
