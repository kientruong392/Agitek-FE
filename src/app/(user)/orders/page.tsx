import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMyOrders } from "@/actions/order.action";
import OrderHistory from "./components/OrderHistory";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user || session.error) {
    redirect("/login?callbackUrl=%2Forders%2F");
  }

  const response = await getMyOrders();
  if (!response.success) {
    if (response.statusCode === 401) redirect("/login?callbackUrl=%2Forders%2F");
    throw new Error(response.message || "Unable to load your orders.");
  }

  return <OrderHistory orders={Array.isArray(response.data) ? response.data : []} />;
}
