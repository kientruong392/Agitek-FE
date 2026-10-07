"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "@tanstack/react-form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { register, loginWithGoogle } from "@/actions/auth.action";
import { registerSchema, type RegisterFormData } from "@/schemas/auth.schema";
import { getErrorMsg, toFormData } from "@/utils/helper.utils";
import { useState } from "react";

const fields: (keyof RegisterFormData)[] = ["username", "fullname", "email", "password", "confirmPassword"];

export default function RegisterForm() {
  const t = useTranslations("Auth");
  const tVal = useTranslations("Auth");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm({
    defaultValues: { username: "", fullname: "", email: "", password: "", confirmPassword: "" } as RegisterFormData,
    validators: { onSubmit: registerSchema },
    onSubmit: async ({ value }) => handleSubmit(value),
  });

  const handleSubmit = async (values: RegisterFormData) => {
    setServerError(null);
    const response = await register(toFormData(values));
    if (!response?.success) {
      setServerError(response?.errorCode ?? "INTERNAL_SERVER_ERROR");
      return;
    }
    router.refresh();
    router.push("/");
  };
  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardContent className="flex flex-col gap-4 p-6 md:p-8">
        <h1 className="text-center text-2xl font-bold">{t("registerTitle")}</h1>
        <form onSubmit={(event) => { event.preventDefault(); void form.handleSubmit(); }} className="flex flex-col gap-4">
          {serverError && <p className="text-center text-sm text-destructive">{getErrorMsg(serverError, tVal)}</p>}
          {fields.map((name) => (
            <form.Field key={name} name={name}>
              {(field) => (
                <Field>
                  <FieldLabel>{t(name)}</FieldLabel>
                  <Input
                    type={name === "password" || name === "confirmPassword" ? "password" : name === "email" ? "email" : "text"}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors.map((error) => ({ message: getErrorMsg(typeof error === "string" ? error : error?.message, tVal) ?? undefined }))} />
                </Field>
              )}
            </form.Field>
          ))}
          <Button type="submit" size="lg" disabled={form.state.isSubmitting}>{form.state.isSubmitting ? "..." : t("registerBtn")}</Button>
        </form>
        <form action={loginWithGoogle}><Button type="submit" variant="outline" className="w-full">{t("registerWithGoogle")}</Button></form>
        <p className="text-center text-sm text-muted-foreground">{t("haveAccount")} <Link href="/login" className="text-primary hover:underline">{t("loginNow")}</Link></p>
      </CardContent>
    </Card>
  );
}
