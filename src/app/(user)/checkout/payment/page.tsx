import PaymentPage from "./components/PaymentPage";

export default async function CheckoutPaymentRoute({ searchParams }: { searchParams: Promise<{ orderId?: string; trackingNumber?: string }> }) {
  const params = await searchParams;
  const orderId = Number(params.orderId);
  if (!Number.isInteger(orderId) || orderId <= 0 || !params.trackingNumber) {
    return <PaymentPage orderId={0} trackingNumber="" />;
  }

  return <PaymentPage orderId={orderId} trackingNumber={params.trackingNumber} />;
}
