"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "@tanstack/react-form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { login, loginWithGoogle } from "@/actions/auth.action";
import { loginSchema, type LoginFormData } from "@/schemas/auth.schema";
import { getErrorMsg, toFormData } from "@/utils/helper.utils";
import { useState } from "react";

const loginFields: { name: keyof LoginFormData; labelKey: string; type?: string }[] = [
  { name: "usernameOrEmail", labelKey: "usernameOrEmail" },
  { name: "password", labelKey: "password", type: "password" },
];

export default function LoginForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(values: LoginFormData) {
    setServerError(null);
    const res = await login(toFormData(values));
    if (!res?.success) {
      setServerError(res.errorCode ?? "UNAUTHORIZED");
      return;
    }
    router.refresh();
    router.push("/");
  }

  const form = useForm({
    defaultValues: { usernameOrEmail: "", password: "" } as LoginFormData,
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => handleSubmit(value),
  });

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardContent className="flex flex-col gap-4 p-6 md:p-8">
        <h2 className="text-center text-2xl font-bold">{t("loginTitle")}</h2>

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            await form.handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          {serverError && <div className="text-center text-sm text-destructive">{getErrorMsg(serverError, t)}</div>}

          {loginFields.map((fieldConfig) => (
            <form.Field key={fieldConfig.name} name={fieldConfig.name}>
              {(field) => (
                <Field>
                  <FieldLabel>{t(fieldConfig.labelKey)}</FieldLabel>
                  <Input
                    type={fieldConfig.type ?? "text"}
                    id={fieldConfig.name}
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
          ))}

          <Button type="submit" className="w-full" size="lg" disabled={form.state.isSubmitting}>
            {form.state.isSubmitting ? "..." : t("loginBtn")}
          </Button>
        </form>

        <form action={loginWithGoogle} className="w-full flex justify-center">
          <Button type="submit" variant="outline" className="w-full">{t("loginWithGoogle")}</Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t("notHaveAccount")}{" "}
          <Link href="/register" className="text-primary hover:underline">{t("registerBtn")}</Link>
        </p>
        <Link href="/forgot-password" className="text-center text-sm text-primary hover:underline">
          {t("forgotPasswordLink")}
        </Link>
      </CardContent>
    </Card>
  );
}

