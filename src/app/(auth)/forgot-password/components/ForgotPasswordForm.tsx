"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "@tanstack/react-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { forgotPassword } from "@/actions/auth.action";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/schemas/auth.schema";
import { getErrorMsg } from "@/utils/helper.utils";

export default function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm({ defaultValues: { email: "" } as ForgotPasswordFormData, validators: { onSubmit: forgotPasswordSchema }, onSubmit: async ({ value }) => handleSubmit(value) });

  const handleSubmit = async (values: ForgotPasswordFormData) => {
    setSuccessMsg(null);
    setServerError(null);
    const response = await forgotPassword(values);
    if (!response?.success) {
      setServerError(response?.errorCode ?? "INTERNAL_SERVER_ERROR");
      return;
    }
    setSuccessMsg(t("forgotPasswordSuccess"));
    form.reset();
  };
  return (
    <Card className="w-full max-w-md">
      <CardHeader><CardTitle className="text-center">{t("forgotPasswordTitle")}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={(event) => { event.preventDefault(); void form.handleSubmit(); }} className="flex flex-col gap-4">
          {serverError && <p className="text-center text-sm text-destructive">{getErrorMsg(serverError, t)}</p>}
          <form.Field name="email">{(field) => <Field><FieldLabel>{t("email")}</FieldLabel><Input type="email" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} /><FieldError errors={field.state.meta.errors.map((error) => ({ message: getErrorMsg(typeof error === "string" ? error : error?.message, t) ?? undefined }))} /></Field>}</form.Field>
          {successMsg && <p className="text-center text-sm text-green-600">{successMsg}</p>}
          <Button type="submit" disabled={form.state.isSubmitting}>{form.state.isSubmitting ? "..." : t("send")}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

