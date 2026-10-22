import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { getMyOrders } from "@/actions/order.action";
import { getMyWarranties } from "@/actions/warranty.action";
import { Button } from "@/components/ui/button";
import WarrantyCenter from "./components/warranty-center";

export default async function WarrantiesPage() {
  const t = await getTranslations("Warranty");
  const session = await auth();
  if (!session?.user || session.error) {
    redirect("/login?callbackUrl=%2Fwarranties%2F");
  }

  const [ordersResponse, warrantiesResponse] = await Promise.all([getMyOrders(), getMyWarranties()]);
  if (!ordersResponse.success || !warrantiesResponse.success) {
    const failedResponse = !ordersResponse.success ? ordersResponse : warrantiesResponse;
    if (failedResponse.statusCode === 401) redirect("/login?callbackUrl=%2Fwarranties%2F");
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="rounded-2xl border border-destructive/30 bg-card p-8">
          <h1 className="text-xl font-semibold">{t("loadErrorTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{failedResponse.message || t("loadErrorFallback")}</p>
          <Button nativeButton={false} render={<Link href="/orders/" />} variant="outline" className="mt-5">{t("viewOrders")}</Button>
        </div>
      </section>
    );
  }

  return <WarrantyCenter orders={Array.isArray(ordersResponse.data) ? ordersResponse.data : []} initialWarranties={Array.isArray(warrantiesResponse.data) ? warrantiesResponse.data : []} />;
}
