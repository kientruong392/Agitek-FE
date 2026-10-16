import Link from "next/link";
import { CheckCircle2, PackageCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ trackingNumber?: string }> }) {
  const { trackingNumber } = await searchParams;
  const t = await getTranslations("Checkout");

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-12">
      <Card className="w-full text-center">
        <CardContent className="flex flex-col items-center gap-5 py-12">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="size-9" /></div>
          <div><h1 className="text-2xl font-bold">{t("successTitle")}</h1><p className="mt-2 text-muted-foreground">{t("successDescription")}</p></div>
          {trackingNumber && <p className="rounded-xl bg-muted px-4 py-2 text-sm">{t("trackingNumber", { trackingNumber })}</p>}
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><PackageCheck className="size-4" />{t("sepayNextStep")}</p>
          <Button render={<Link href="/" />}>{t("continueShopping")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
