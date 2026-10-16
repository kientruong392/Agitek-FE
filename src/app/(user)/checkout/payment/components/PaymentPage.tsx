"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Clock3, Copy, LoaderCircle, QrCode } from "lucide-react";
import { getPublicPayment, type PublicPayment } from "@/actions/order.action";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { useTranslations } from "next-intl";

const PENDING = 0;
const SUCCESS = 1;
const FAILED = 2;
const EXPIRED = 4;
const PAID_ORDER = 9;

function formatPrice(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export default function PaymentPage({ orderId, trackingNumber }: { orderId: number; trackingNumber: string }) {
  const t = useTranslations("CheckoutPayment");
  const [now, setNow] = useState(Date.now());
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["checkout-payment", orderId, trackingNumber],
    queryFn: () => getPublicPayment(orderId, trackingNumber),
    enabled: orderId > 0 && !!trackingNumber,
    refetchInterval: (query) => {
      const payment = query.state.data?.data as PublicPayment | undefined;
      return payment?.status === PENDING && payment.orderStatus !== 7 && payment.expiresAt && new Date(payment.expiresAt).getTime() > Date.now() ? 5000 : false;
    },
  });
  const payment = response?.success ? response.data : undefined;
  const remainingSeconds = useMemo(() => {
    if (!payment?.expiresAt) return 0;
    return Math.max(0, Math.ceil((new Date(payment.expiresAt).getTime() - now) / 1000));
  }, [payment?.expiresAt, now]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.add({ title: t("copied", { label }), type: "success" });
    } catch {
      toast.add({ title: t("copyError"), type: "error" });
    }
  };

  const terminalExpired = payment?.status === EXPIRED || payment?.orderStatus === 7;
  const paid = payment?.status === SUCCESS || payment?.orderStatus === PAID_ORDER;
  const failed = payment?.status === FAILED || terminalExpired;

  if (isLoading) {
    return <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center gap-3 px-4 text-muted-foreground"><LoaderCircle className="size-5 animate-spin" />{t("loading")}</div>;
  }

  if (isError || !payment) {
    return <div className="mx-auto max-w-3xl px-4 py-12"><Alert variant="destructive"><AlertCircle className="size-4" /><AlertDescription>{response?.message || t("loadError")}</AlertDescription></Alert><Button className="mt-5" render={<Link href="/" />}>{t("continueShopping")}</Button></div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
      <Card className="overflow-hidden">
        <CardHeader className="text-center">
          <div className={`mx-auto flex size-14 items-center justify-center rounded-full ${paid ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : failed ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
            {paid ? <CheckCircle2 className="size-7" /> : failed ? <AlertCircle className="size-7" /> : <QrCode className="size-7" />}
          </div>
          <CardTitle className="text-2xl">{paid ? t("paidTitle") : failed ? t(terminalExpired ? "expiredTitle" : "failedTitle") : t("title")}</CardTitle>
          <CardDescription>{paid ? t("paidDescription") : failed ? t(terminalExpired ? "expiredDescription" : "failedDescription") : t("description")}</CardDescription>
          <div><Badge variant={paid ? "default" : failed ? "destructive" : "secondary"}>{paid ? t("paid") : failed ? t(terminalExpired ? "expired" : "failed") : t("pending")}</Badge></div>
        </CardHeader>
        <CardContent className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col items-center gap-4">
            {payment.qrCodeUrl && !failed && !paid ? (
              <Image src={payment.qrCodeUrl} alt={t("qrAlt")} width={320} height={320} unoptimized className="aspect-square w-full max-w-80 rounded-xl border bg-white object-contain p-2" />
            ) : (
              <div className="flex aspect-square w-full max-w-80 items-center justify-center rounded-xl border bg-muted text-muted-foreground">{paid ? <CheckCircle2 className="size-16" /> : <AlertCircle className="size-16" />}</div>
            )}
            {!paid && !failed && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="size-4" />{remainingSeconds > 0 ? t("expiresIn", { time: `${Math.floor(remainingSeconds / 60).toString().padStart(2, "0")}:${(remainingSeconds % 60).toString().padStart(2, "0")}` }) : t("checkingExpiry")}</p>}
          </div>
          <div className="space-y-5">
            <div><p className="text-sm text-muted-foreground">{t("amount")}</p><div className="mt-1 flex items-center justify-between gap-3"><p className="text-2xl font-bold text-primary">{formatPrice(payment.amount)}</p><Button type="button" variant="outline" size="icon" aria-label={t("copyAmount")} onClick={() => void copy(String(Math.round(payment.amount)), t("amountLabel"))}><Copy className="size-4" /></Button></div></div>
            <Separator />
            <div className="space-y-4">
              <CopyRow label={t("bank")} value={payment.bankId || "—"} onCopy={() => void copy(payment.bankId || "", t("bankLabel"))} />
              <CopyRow label={t("accountNumber")} value={payment.accountNumber || "—"} onCopy={() => void copy(payment.accountNumber || "", t("accountNumberLabel"))} />
              <CopyRow label={t("accountName")} value={payment.accountName || "—"} onCopy={() => void copy(payment.accountName || "", t("accountNameLabel"))} />
              <CopyRow label={t("transferDescription")} value={payment.transferDescription || `DH${orderId}`} onCopy={() => void copy(payment.transferDescription || `DH${orderId}`, t("descriptionLabel"))} />
            </div>
            {!paid && !failed && <Alert><Clock3 className="size-4" /><AlertDescription>{t("pendingHint")}</AlertDescription></Alert>}
            {paid && <Alert><CheckCircle2 className="size-4" /><AlertDescription>{t("paidDescription")}</AlertDescription></Alert>}
            {failed && <Alert variant="destructive"><AlertCircle className="size-4" /><AlertDescription>{t(terminalExpired ? "expiredDescription" : "failedDescription")}</AlertDescription></Alert>}
            <Button className="w-full" render={<Link href="/" />}>{t("continueShopping")}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CopyRow({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return <div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="break-all font-medium">{value}</p></div><Button type="button" variant="ghost" size="icon" aria-label={label} onClick={onCopy}><Copy className="size-4" /></Button></div>;
}
