import { z } from "zod";

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, { message: "usernameOrEmailRequired" }),
  password: z.string().min(1, { message: "passwordRequired" }),
});

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, { message: "usernameRequired" }),
  fullname: z
    .string()
    .trim()
    .min(1, { message: "fullnameRequired" })
    .max(100, { message: "fullnameMaxLength" }),
  email: z
    .string()
    .trim()
    .min(1, { message: "emailRequired" })
    .email({ message: "invalidEmail" }),
  password: z
    .string()
    .trim()
    .min(1, { message: "passwordRequired" })
    .min(6, { message: "passwordMinLength" }),
  confirmPassword: z.string().min(1, { message: "confirmPasswordRequired" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "passwordMismatch",
  path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

export const verifyAccountSchema = z.object({
  token: z.string().min(1, { message: "tokenRequired" }),
});

export type VerifyAccountFormData = z.infer<typeof verifyAccountSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "emailRequired" })
    .email({ message: "invalidEmail" }),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .trim()
    .min(1, { message: "passwordRequired" })
    .min(6, { message: "passwordMinLength" }),
  confirmPassword: z.string().min(1, { message: "confirmPasswordRequired" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "passwordMismatch",
  path: ["confirmPassword"],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
