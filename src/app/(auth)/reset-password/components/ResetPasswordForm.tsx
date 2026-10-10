"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "@tanstack/react-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { resetPassword } from "@/actions/auth.action";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/schemas/auth.schema";
import { getErrorMsg } from "@/utils/helper.utils";

export default function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("Auth");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const form = useForm({ defaultValues: { password: "", confirmPassword: "" } as ResetPasswordFormData, validators: { onSubmit: resetPasswordSchema, }, onSubmit: async ({ value }) => handleSubmit(value) });

  const handleSubmit = async (values: ResetPasswordFormData) => {
    setSuccessMsg(null);
    setServerError(null);
    const response = await resetPassword(values, token);
    if (!response?.success) {
      setServerError(response?.errorCode ?? "INTERNAL_SERVER_ERROR");
      return;
    }
    setSuccessMsg(t("resetPasswordSuccess"));
    form.reset();
    setTimeout(() => router.push("/login"), 2000);
  };
  return (
    <Card className="w-full max-w-md"><CardHeader><CardTitle className="text-center">{t("resetPasswordTitle")}</CardTitle></CardHeader><CardContent>
      <form onSubmit={(event) => { event.preventDefault(); void form.handleSubmit(); }} className="flex flex-col gap-4">
        {serverError && <p className="text-center text-sm text-destructive">{getErrorMsg(serverError, t)}</p>}
        {(["password", "confirmPassword"] as const).map((name) => <form.Field key={name} name={name}>{(field) => <Field><FieldLabel>{t(name)}</FieldLabel><Input type="password" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} /><FieldError errors={field.state.meta.errors.map((error) => ({ message: getErrorMsg(typeof error === "string" ? error : error?.message, t) ?? undefined }))} /></Field>}</form.Field>)}
        {successMsg && <p className="text-center text-sm text-green-600">{successMsg}</p>}
        <Button type="submit" disabled={form.state.isSubmitting}>{form.state.isSubmitting ? "..." : t("resetPasswordBtn")}</Button>
      </form>
    </CardContent></Card>
  );
}

