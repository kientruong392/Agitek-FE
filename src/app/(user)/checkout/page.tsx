import CheckoutPage from "./components/CheckoutPage";
import { checkLogin } from "@/actions/auth.action";
import { getMyAccount, getMyAddresses } from "@/actions/profile.action";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function CheckoutRoute({ searchParams }: { searchParams: Promise<{ pcBuilder?: string; products?: string }> }) {
  const params = await searchParams;
  if (params.pcBuilder === "1") {
    const session = await auth();
    if (!session?.user || session.error) redirect("/login?callbackUrl=%2Fpc-builder");
    if (session.user.role !== "Customer") redirect("/");
  }
  const builderProductIds = params.pcBuilder === "1"
    ? [...new Set((typeof params.products === "string" ? params.products : "").split(",").map(Number)
      .filter((id) => Number.isSafeInteger(id) && id > 0))].slice(0, 8)
    : undefined;
  const isLogin = await checkLogin();
  let accountData;
  let addressesData;

  if (isLogin) {
    accountData = await getMyAccount();
    if (accountData.success && accountData.data) {
      addressesData = await getMyAddresses(accountData.data.id);
    }
  }

  return (
    <CheckoutPage
      isLogin={isLogin}
      builderProductIds={builderProductIds}
      account={accountData?.success ? accountData.data : undefined}
      addresses={addressesData?.success ? addressesData.data ?? [] : []}
    />
  );
}
