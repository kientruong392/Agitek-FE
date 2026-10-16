"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Check, LoaderCircle, MapPin, TicketPercent, Truck } from "lucide-react";
import { applyVoucher, createGuestOrder, createOrder, type GuestCheckoutInput, type ShippingType } from "@/actions/order.action";
import { getProductById } from "@/actions/product.action";
import { useCart } from "@/components/providers/CartProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import type { Address, Product, UserDTO } from "@/types/model.types";

const SHIPPING_FEES: Record<ShippingType, number> = { 0: 30000, 1: 50000 };
const FALLBACK_IMAGE = "/images/no-image.png";
const PHONE_PATTERN = /^(?:\+84|0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
const MAX_ORDER_NOTE_LENGTH = 255;

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

type Props = { isLogin: boolean; account?: UserDTO; addresses: Address[] };
type CheckoutProduct = { product: Product; quantity: number; unitPrice: number };

export default function CheckoutPage({ isLogin, account, addresses }: Props) {
  const t = useTranslations("Checkout");
  const router = useRouter();
  const { items, isLoading, clearItems } = useCart();
  const [products, setProducts] = useState<CheckoutProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);
  const [shippingType, setShippingType] = useState<ShippingType>(0);
  const [paymentMethod, setPaymentMethod] = useState<0 | 1>(0);
  const [note, setNote] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestAddress, setGuestAddress] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucher, setVoucher] = useState<{ voucherId: number; code: string; discountAmount: number } | null>(null);
  const [guestErrors, setGuestErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];
  const accountDisplayName = account?.profile.fullName;

  useEffect(() => {
    let cancelled = false;
    setProductsLoading(true);
    void Promise.all(items.map(async (item) => {
      const response = await getProductById(item.productId);
      if (!response.success || !response.data) return null;
      const product = response.data;
      const unitPrice = product.discountPrice != null && product.discountPrice < product.originalPrice
        ? product.discountPrice
        : product.originalPrice;
      return { product, quantity: item.quantity, unitPrice };
    })).then((result) => {
      if (!cancelled) {
        const loadedProducts = result.filter((item): item is CheckoutProduct => item !== null);
        setProducts(loadedProducts);
        setProductsError(loadedProducts.length !== items.length);
        setProductsLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setProducts([]);
        setProductsError(true);
        setProductsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [items]);

  const subtotal = useMemo(() => products.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [products]);
  const shippingFee = SHIPPING_FEES[shippingType];
  const total = Math.max(0, subtotal + shippingFee - (voucher?.discountAmount ?? 0));
  const orderDetails = products.map(({ product, quantity, unitPrice }) => ({
    productId: product.id,
    quantity,
    unitPrice,
    totalPrice: unitPrice * quantity,
  }));

  const voucherMutation = useMutation({
    mutationFn: () => applyVoucher(voucherCode.trim(), subtotal),
    onSuccess: (response) => {
      if (!response.success || !response.data) {
        setVoucher(null);
        setFormError(response.message || t("voucherError"));
        toast.add({ title: response.message || t("voucherError"), type: "error" });
        return;
      }
      setVoucher(response.data);
      setFormError("");
      toast.add({ title: t("voucherApplied"), type: "success" });
    },
  });

  const orderMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        voucherCode: voucher?.code ?? null,
        shippingType,
        paymentMethod,
        note: note.trim() || undefined,
        orderDetails,
      };
      if (isLogin) {
        if (!defaultAddress) throw new Error(t("addressRequired"));
        return createOrder({ ...payload, addressId: defaultAddress.id });
      }
      const guestPayload: GuestCheckoutInput = {
        ...payload,
        createGuest: { fullName: guestName.trim(), phoneNumber: guestPhone.trim(), address: guestAddress.trim() },
      };
      return createGuestOrder(guestPayload);
    },
    onSuccess: async (response) => {
      if (!response.success || !response.data) {
        setFormError(response.message || t("orderError"));
        toast.add({ title: response.message || t("orderError"), type: "error" });
        return;
      }
      const cartCleared = await clearItems();
      if (!cartCleared) toast.add({ title: t("cartClearError"), type: "error" });
      toast.add({ title: t("orderSuccess", { trackingNumber: response.data.trackingNumber }), type: "success" });
      if (paymentMethod === 1) {
        router.push(`/checkout/payment?orderId=${response.data.id}&trackingNumber=${encodeURIComponent(response.data.trackingNumber)}`);
      } else {
        router.push(`/checkout/success?trackingNumber=${encodeURIComponent(response.data.trackingNumber)}`);
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : t("orderError");
      setFormError(message);
      toast.add({ title: message, type: "error" });
    },
  });

  const validateGuest = () => {
    const errors: Record<string, string> = {};
    if (!guestName.trim()) errors.fullName = t("required");
    if (!PHONE_PATTERN.test(guestPhone.trim())) errors.phoneNumber = t("invalidPhone");
    if (!guestAddress.trim()) errors.address = t("required");
    setGuestErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    if (productsLoading || productsError || !products.length) {
      setFormError(t("cartUnavailable"));
      return;
    }
    if (isLogin && !defaultAddress) {
      setFormError(t("addressRequired"));
      return;
    }
    if (!isLogin && !validateGuest()) return;
    orderMutation.mutate();
  };

  const removeVoucher = () => {
    setVoucher(null);
    setVoucherCode("");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <Link href="/" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{t("continueShopping")}</Link>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Badge variant="secondary" className="hidden sm:inline-flex">{t("itemCount", { count: items.reduce((sum, item) => sum + item.quantity, 0) })}</Badge>
      </div>

      {isLoading || productsLoading ? (
        <div className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground"><LoaderCircle className="size-5 animate-spin" />{t("loading")}</div>
      ) : !items.length ? (
        <Card><CardContent className="flex flex-col items-center gap-4 py-16 text-center"><p className="text-muted-foreground">{t("emptyCart")}</p><Button render={<Link href="/" />}>{t("continueShopping")}</Button></CardContent></Card>
      ) : (
        <form onSubmit={handleSubmit} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.85fr)] lg:gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="size-5 text-primary" />{t("shippingInfo")}</CardTitle><CardDescription>{isLogin ? t("savedAddressDescription") : t("guestDescription")}</CardDescription></CardHeader>
              <CardContent>
                {isLogin ? defaultAddress ? (
                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{defaultAddress.receiverName || accountDisplayName}</p>{defaultAddress.isDefault && <Badge>{t("defaultAddress")}</Badge>}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{defaultAddress.phoneNumber}</p>
                    <p className="mt-2 text-sm">{defaultAddress.addressLine}</p>
                    {!addresses.some((address) => address.isDefault) && <p className="mt-3 text-xs text-muted-foreground">{t("firstAddressNotice")}</p>}
                  </div>
                ) : <Alert><AlertDescription>{t("addressRequired")}</AlertDescription></Alert> : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label htmlFor="guest-name">{t("fullName")}</Label><Input id="guest-name" autoComplete="name" value={guestName} aria-invalid={!!guestErrors.fullName} onChange={(event) => setGuestName(event.target.value)} />{guestErrors.fullName && <p className="text-xs text-destructive">{guestErrors.fullName}</p>}</div>
                    <div className="space-y-2"><Label htmlFor="guest-phone">{t("phoneNumber")}</Label><Input id="guest-phone" type="tel" autoComplete="tel" value={guestPhone} aria-invalid={!!guestErrors.phoneNumber} onChange={(event) => setGuestPhone(event.target.value)} />{guestErrors.phoneNumber && <p className="text-xs text-destructive">{guestErrors.phoneNumber}</p>}</div>
                    <div className="space-y-2 sm:col-span-2"><Label htmlFor="guest-address">{t("address")}</Label><Textarea id="guest-address" autoComplete="street-address" value={guestAddress} aria-invalid={!!guestErrors.address} onChange={(event) => setGuestAddress(event.target.value)} />{guestErrors.address && <p className="text-xs text-destructive">{guestErrors.address}</p>}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="size-5 text-primary" />{t("shippingMethod")}</CardTitle></CardHeader>
              <CardContent>
                <RadioGroup value={String(shippingType)} onValueChange={(value) => setShippingType(Number(value) as ShippingType)}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4 has-checked:border-primary has-checked:bg-primary/5"><RadioGroupItem value="0" id="shipping-standard" /><span className="min-w-0 flex-1"><span className="block font-medium">{t("standard")}</span><span className="text-sm text-muted-foreground">{t("standardDescription")}</span></span><span className="font-semibold">{formatPrice(SHIPPING_FEES[0])}</span></label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4 has-checked:border-primary has-checked:bg-primary/5"><RadioGroupItem value="1" id="shipping-express" /><span className="min-w-0 flex-1"><span className="block font-medium">{t("express")}</span><span className="text-sm text-muted-foreground">{t("expressDescription")}</span></span><span className="font-semibold">{formatPrice(SHIPPING_FEES[1])}</span></label>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t("paymentMethod")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={String(paymentMethod)} onValueChange={(value) => setPaymentMethod(Number(value) as 0 | 1)}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4 has-checked:border-primary has-checked:bg-primary/5"><RadioGroupItem value="0" id="payment-cod" /><span><span className="block font-medium">{t("cod")}</span><span className="text-sm text-muted-foreground">{t("codDescription")}</span></span></label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4 has-checked:border-primary has-checked:bg-primary/5"><RadioGroupItem value="1" id="payment-sepay" /><span><span className="block font-medium">{t("sepay")}</span><span className="text-sm text-muted-foreground">{t("sepayDescription")}</span></span></label>
                </RadioGroup>
                {paymentMethod === 1 && <Alert><AlertDescription>{t("sepayNotice")}</AlertDescription></Alert>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t("orderNote")}</CardTitle><CardDescription>{t("orderNoteDescription")}</CardDescription></CardHeader>
              <CardContent><Textarea value={note} maxLength={MAX_ORDER_NOTE_LENGTH} placeholder={t("orderNotePlaceholder")} onChange={(event) => setNote(event.target.value)} /></CardContent>
            </Card>
            {formError && <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>}
            <Button type="submit" size="lg" className="w-full bg-green-600 text-white hover:bg-green-700" disabled={orderMutation.isPending || (isLogin && !defaultAddress)}>
              {orderMutation.isPending ? <><LoaderCircle className="animate-spin" />{t("placingOrder")}</> : <><Check />{t("completeOrder")}</>}
            </Button>
          </div>

          <Card className="lg:sticky lg:top-20">
            <CardHeader><CardTitle>{t("orderSummary")}</CardTitle><CardDescription>{t("summaryDescription", { count: products.length })}</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <div className="max-h-112 space-y-4 overflow-y-auto pr-1">
                {products.map(({ product, quantity, unitPrice }) => {
                  const image = product.images?.find((candidate) => candidate.isPrimary) ?? product.images?.[0];
                  return <div key={product.id} className="flex gap-3">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border bg-muted"><Image src={image?.imageUrl || FALLBACK_IMAGE} alt={product.productName} fill sizes="64px" className="object-contain p-1" unoptimized /><span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">{quantity}</span></div>
                    <div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-medium">{product.productName}</p><p className="mt-1 text-xs text-muted-foreground">{t("quantity", { count: quantity })}</p></div>
                    <p className="shrink-0 text-sm font-semibold">{formatPrice(unitPrice * quantity)}</p>
                  </div>;
                })}
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="voucher-code" className="flex items-center gap-2"><TicketPercent className="size-4" />{t("voucher")}</Label>
                <div className="flex gap-2"><Input id="voucher-code" value={voucherCode} disabled={!!voucher} placeholder={t("voucherPlaceholder")} onChange={(event) => setVoucherCode(event.target.value)} /><Button type="button" variant={voucher ? "outline" : "secondary"} disabled={voucherMutation.isPending || (!voucher && !voucherCode.trim())} onClick={() => voucher ? removeVoucher() : voucherMutation.mutate()}>{voucher ? t("removeVoucher") : voucherMutation.isPending ? t("applying") : t("applyVoucher")}</Button></div>
                {voucher && <p className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400"><Check className="size-3" />{t("voucherAppliedCode", { code: voucher.code })}</p>}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">{t("subtotal")}</span><span>{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">{t("shippingFee")}</span><span>{formatPrice(shippingFee)}</span></div>
                {voucher && <div className="flex justify-between gap-3 text-green-700 dark:text-green-400"><span>{t("discount")}</span><span>−{formatPrice(voucher.discountAmount)}</span></div>}
                <Separator />
                <div className="flex items-end justify-between gap-3"><span className="font-semibold">{t("total")}</span><span className="text-xl font-bold text-primary">{formatPrice(total)}</span></div>
                <p className="text-xs text-muted-foreground">{t("taxNotice")}</p>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
