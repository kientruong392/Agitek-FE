import CheckoutPage from "./components/CheckoutPage";
import { checkLogin } from "@/actions/auth.action";
import { getMyAccount, getMyAddresses } from "@/actions/profile.action";

export default async function CheckoutRoute() {
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
      account={accountData?.success ? accountData.data : undefined}
      addresses={addressesData?.success ? addressesData.data ?? [] : []}
    />
  );
}
