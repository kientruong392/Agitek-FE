"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "@tanstack/react-form";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { verifyAccount, resendVerifyCode } from "@/actions/auth.action";
import { verifyAccountSchema, type VerifyAccountFormData } from "@/schemas/auth.schema";
import { getErrorMsg, toFormData } from "@/utils/helper.utils";

export default function VerifyAccountForm({ id }: { id: string }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [resent, setResent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm({ defaultValues: { token: "" } as VerifyAccountFormData,
    validators: { onSubmit: verifyAccountSchema },
    onSubmit: async ({ value }) => handleSubmit(value) });

  const handleSubmit = async (values: VerifyAccountFormData) => {
    setSuccess(false);
    setServerError(null);
    const response = await verifyAccount(toFormData(values));
    if (!response?.success) {
      setServerError(response?.errorCode ?? "INVALID_TOKEN");
      return;
    }
    setSuccess(true);
    form.reset();
    router.push("/");
  };

  const handleResend = async () => {
    setResent(false);
    setServerError(null);
    const response = await resendVerifyCode(id);
    if (!response?.success) {
      setServerError(response?.errorCode ?? "UNAUTHORIZED");
      return;
    }
    setResent(true);
  };
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">{t("verifyTitle")}</CardTitle>
        <CardDescription className={resent ? "text-center text-green-600" : "text-center"}>{resent ? t("resendSuccess") : t("verifyDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => { event.preventDefault(); void form.handleSubmit(); }} className="flex flex-col gap-4">
          {serverError && <p className="text-center text-sm text-destructive">{getErrorMsg(serverError, t)}</p>}
          {success && <p className="text-center text-sm text-green-600">{t("verifySuccess")}</p>}
          <form.Field name="token">{(field) => <Field><FieldLabel>{t("verifyBtn")}</FieldLabel><Input value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} /><FieldError errors={field.state.meta.errors.map((error) => ({ message: getErrorMsg(typeof error === "string" ? error : error?.message, t) ?? undefined }))} /></Field>}</form.Field>
          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={form.state.isSubmitting}>{form.state.isSubmitting ? "..." : t("verifyBtn")}</Button>
            <Button type="button" variant="outline" className="flex-1" onClick={handleResend}>{t("resendCode")}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
