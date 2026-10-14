import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMyAccount, getMyAddresses } from "@/actions/profile.action";
import UserProfilePage from "./components/UserProfilePage";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user || session.error) {
    redirect("/login?callbackUrl=%2Fprofile%2F");
  }

  const accountResponse = await getMyAccount();
  if (!accountResponse.success || !accountResponse.data) {
    throw new Error(`GET /User/me failed: ${accountResponse.message || accountResponse.errorCode || "No account data returned"}`);
  }

  const addressResponse = await getMyAddresses(accountResponse.data.id);
  if (!addressResponse.success) {
    throw new Error(addressResponse.message || "Unable to load saved addresses.");
  }

  const addresses = Array.isArray(addressResponse.data) ? addressResponse.data : [];
  return <UserProfilePage account={accountResponse.data} profile={accountResponse.data.profile} addresses={addresses} />;
}
