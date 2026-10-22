"use client";

import Link from "next/link";
import { ArrowLeft, Box, PackageCheck, Send, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  { icon: Box, title: "packingStepOneTitle", description: "packingStepOneDescription" },
  { icon: ShieldCheck, title: "packingStepTwoTitle", description: "packingStepTwoDescription" },
  { icon: Send, title: "packingStepThreeTitle", description: "packingStepThreeDescription" },
] as const;

export default function PackingInstructions() {
  const t = useTranslations("Warranty");

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Button nativeButton={false} render={<Link href="/warranties/" />} variant="ghost" className="w-fit px-0 hover:bg-transparent hover:text-primary">
        <ArrowLeft className="size-4" />
        {t("backToWarranty")}
      </Button>
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><PackageCheck className="size-5" /></div>
            <div>
              <CardTitle className="text-xl">{t("packingTitle")}</CardTitle>
              <CardDescription className="mt-1">{t("packingIntro")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-5 sm:p-6">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <div key={title} className="flex gap-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</div>
              <div className="min-w-0 pt-1">
                <div className="flex items-center gap-2"><Icon className="size-4 text-primary" /><h2 className="font-semibold">{t(title)}</h2></div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{t(description)}</p>
              </div>
            </div>
          ))}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <h2 className="font-semibold text-amber-900 dark:text-amber-300">{t("packingNoticeTitle")}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("packingNoticeDescription")}</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
