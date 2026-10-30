"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, CircuitBoard, Cpu, Fan, Gpu, HardDrive, LoaderCircle, Lock, MemoryStick, Plus, Power, Save, CreditCard, Trash2, Zap } from "lucide-react";
import { deletePcBuild, getPcBuildProducts, getPcBuilds, savePcBuild } from "@/actions/pc-build.action";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { PcComponentType, type PcBuild, type Product } from "@/types/model.types";

const SLOTS = [
  { type: PcComponentType.Mainboard, code: "MAIN", key: "mainboard", icon: CircuitBoard, position: "col-start-2 row-start-2" },
  { type: PcComponentType.Cpu, code: "CPU", key: "cpu", icon: Cpu, position: "col-start-2 row-start-1" },
  { type: PcComponentType.CpuCooler, code: "COOL", key: "cooler", icon: Fan, position: "col-start-1 row-start-1" },
  { type: PcComponentType.Ram, code: "RAM", key: "ram", icon: MemoryStick, position: "col-start-3 row-start-1" },
  { type: PcComponentType.GraphicsCard, code: "VGA", key: "gpu", icon: Gpu, position: "col-start-3 row-start-2" },
  { type: PcComponentType.Storage, code: "DRIVE", key: "storage", icon: HardDrive, position: "col-start-3 row-start-3" },
  { type: PcComponentType.PowerSupply, code: "PSU", key: "psu", icon: Power, position: "col-start-2 row-start-3" },
  { type: PcComponentType.Case, code: "CASE", key: "case", icon: Box, position: "col-start-1 row-start-2" },
] as const;

type Parts = Partial<Record<PcComponentType, Product>>;
type Confirmation = { kind: "mainboard" | "clear" | "delete" | "load"; build?: PcBuild };
type Connection = { type: PcComponentType; x1: number; y1: number; x2: number; y2: number };

function cardEdge(rect: DOMRect, target: DOMRect, board: DOMRect) {
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const dx = target.left + target.width / 2 - x;
  const dy = target.top + target.height / 2 - y;
  const distance = Math.min(
    dx === 0 ? Infinity : (rect.width / 2 + 4) / Math.abs(dx),
    dy === 0 ? Infinity : (rect.height / 2 + 4) / Math.abs(dy),
  );
  return { x: x + dx * distance - board.left, y: y + dy * distance - board.top };
}

function productImage(product: Product) {
  return (product.images?.find((image) => image.isPrimary) ?? product.images?.[0])?.imageUrl || "/images/no-image.png";
}

function productPrice(product: Product) {
  return product.discountPrice != null && product.discountPrice >= 0 && product.discountPrice < product.originalPrice
    ? product.discountPrice : product.originalPrice;
}

function productTdp(product: Product) {
  const value = product.specifications?.find((spec) => spec.specName.trim().toLowerCase() === "tdp")?.specValue;
  return value ? Number(value) || 0 : 0;
}

export default function PcBuilder({ userId }: { userId: string }) {
  const t = useTranslations("PcBuilder");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const boardRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [parts, setParts] = useState<Parts>({});
  const [buildId, setBuildId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [choosing, setChoosing] = useState<PcComponentType | null>(null);
  const [search, setSearch] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const selection = useMemo(() => SLOTS.flatMap((slot) => parts[slot.type] ? [parts[slot.type]!.id] : []), [parts]);
  const mainboard = parts[PcComponentType.Mainboard];
  const choosingSlot = SLOTS.find((slot) => slot.type === choosing);
  const price = (value: number) => new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", { style: "currency", currency: "VND" }).format(value);
  const slotLabel = (component: PcComponentType) => t(`components.${SLOTS.find((slot) => slot.type === component)?.key ?? "mainboard"}`);
  const errorMessage = (code?: string) => {
    if (code === "PC_BUILD_LIMIT_REACHED") return t("limitReached");
    if (code === "PC_BUILD_INCOMPLETE") return t("incomplete");
    if (code === "PC_BUILD_INCOMPATIBLE") return t("incompatible");
    if (code === "PC_BUILD_MAINBOARD_REQUIRED") return t("selectMainboard");
    return t("requestError");
  };

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const cards = board.querySelectorAll<HTMLElement>("[data-pc-slot]");
    const main = board.querySelector<HTMLElement>(`[data-pc-slot="${PcComponentType.Mainboard}"]`);
    if (!main) return;

    const observer = new ResizeObserver(() => {
      const boardRect = board.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
      const next: Connection[] = [];
      for (const card of cards) {
        const type = Number(card.dataset.pcSlot) as PcComponentType;
        if (type === PcComponentType.Mainboard) continue;
        const cardRect = card.getBoundingClientRect();
        const start = cardEdge(cardRect, mainRect, boardRect);
        const end = cardEdge(mainRect, cardRect, boardRect);
        next.push({ type, x1: start.x, y1: start.y, x2: end.x, y2: end.y });
      }
      setConnections(next);
    });
    observer.observe(board);
    for (const card of cards) observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const builds = useQuery({
    queryKey: ["pc-builds", userId], retry: false,
    queryFn: async () => {
      const response = await getPcBuilds();
      if (!response.success) throw new Error(response.errorCode);
      return response.data ?? [];
    },
  });
  const context = choosing === PcComponentType.Mainboard ? [] : selection;
  const recommendations = useQuery({
    queryKey: ["pc-build-recommendations", choosing, context], enabled: choosing !== null, retry: false,
    queryFn: async () => {
      const response = await getPcBuildProducts(choosing!, context);
      if (!response.success) throw new Error(response.errorCode);
      return response.data ?? [];
    },
  });

  const loadBuild = (build: PcBuild) => {
    setParts(Object.fromEntries(build.products.flatMap((product) => {
      const slot = SLOTS.find((candidate) => candidate.code === product.categoryCode);
      return slot ? [[slot.type, product]] : [];
    })));
    setBuildId(build.id);
    setName(build.name);
  };
  const saveMutation = useMutation({
    mutationFn: () => savePcBuild(name.trim(), selection, buildId ?? undefined),
    onSuccess: (response) => {
      if (!response.success || !response.data) {
        toast.add({ title: errorMessage(response.errorCode), type: "error" });
        return;
      }
      loadBuild(response.data);
      setSaveOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["pc-builds", userId] });
      toast.add({ title: t("saved"), type: "success" });
    },
    onError: () => toast.add({ title: t("requestError"), type: "error" }),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deletePcBuild(buildId!),
    onSuccess: (response) => {
      if (!response.success) { toast.add({ title: t("requestError"), type: "error" }); return; }
      setParts({}); setBuildId(null); setName("");
      void queryClient.invalidateQueries({ queryKey: ["pc-builds", userId] });
      toast.add({ title: t("deleted"), type: "success" });
    },
    onError: () => toast.add({ title: t("requestError"), type: "error" }),
  });
  const busy = saveMutation.isPending || deleteMutation.isPending;
  const selectedProducts = Object.values(parts);
  const totalTdp = SLOTS.reduce((sum, slot) => sum + (slot.type !== PcComponentType.PowerSupply && parts[slot.type] ? productTdp(parts[slot.type]!) : 0), 0);
  const totalPrice = selectedProducts.reduce((sum, product) => sum + productPrice(product), 0);
  const requiredWatt = Math.ceil((totalTdp + 50) * 1.3);
  const options = (recommendations.data ?? []).filter((product) => `${product.productName} ${product.sku}`.toLowerCase().includes(search.trim().toLowerCase()));

  function openSlot(component: PcComponentType) {
    if (component === PcComponentType.Mainboard && selection.length > 1) { setConfirmation({ kind: "mainboard" }); return; }
    setSearch(""); setChoosing(component);
  }

  function selectPart(product: Product) {
    setParts((current) => {
      if (choosing === PcComponentType.Mainboard) return { [PcComponentType.Mainboard]: product };
      const next = { ...current, [choosing!]: product };
      if (choosing !== PcComponentType.PowerSupply) delete next[PcComponentType.PowerSupply];
      return next;
    });
    setChoosing(null);
  }

  function confirm() {
    if (confirmation?.kind === "mainboard") { setSearch(""); setChoosing(PcComponentType.Mainboard); }
    else if (confirmation?.kind === "delete") deleteMutation.mutate();
    else if (confirmation?.kind === "load" && confirmation.build) loadBuild(confirmation.build);
    else { setParts({}); setBuildId(null); setName(""); }
    setConfirmation(null);
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 pb-56 md:px-4 md:py-10 md:pb-36">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div><Badge variant="outline" className="mb-3">{t("badge")}</Badge><h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t("title")}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("description")}</p></div>
        <Button variant="outline" disabled={busy} onClick={() => selection.length ? setConfirmation({ kind: "clear" }) : (setBuildId(null), setName(""))}><Plus />{t("newBuild")}</Button>
      </header>

      <Card className="mb-6 gap-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Label htmlFor="saved-pc-build" className="shrink-0">{t("myBuilds", { count: builds.data?.length ?? 0 })}</Label>
          <Select value={buildId === null ? null : String(buildId)} disabled={busy || builds.isLoading || !builds.data?.length} onValueChange={(value) => {
            const build = builds.data?.find((item) => item.id === Number(value));
            if (!build) return;
            if (selection.length) setConfirmation({ kind: "load", build }); else loadBuild(build);
          }}>
            <SelectTrigger id="saved-pc-build" className="w-full sm:w-80"><SelectValue placeholder={t("selectBuild")}>{builds.data?.find((build) => build.id === buildId)?.name ?? t("selectBuild")}</SelectValue></SelectTrigger>
            <SelectContent>{builds.data?.map((build) => <SelectItem key={build.id} value={String(build.id)}>{build.name}</SelectItem>)}</SelectContent>
          </Select>
          {buildId !== null && <Button variant="ghost" size="icon" disabled={busy} aria-label={t("deleteBuild")} onClick={() => setConfirmation({ kind: "delete" })}><Trash2 /></Button>}
        </div>
        {builds.isError && <div className="flex items-center gap-3 text-sm text-destructive">{t("loadBuildsError")}<Button variant="outline" size="sm" onClick={() => void builds.refetch()}>{t("retry")}</Button></div>}
        <p className="text-xs text-muted-foreground">{t("savedHint")}</p>
      </Card>

      <div className="relative rounded-3xl border bg-muted/20 p-3 sm:p-6 md:p-10" style={{ backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
        <div ref={boardRef} className="relative grid h-[620px] grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)] gap-x-3 gap-y-7 sm:h-[680px] sm:gap-x-8 sm:gap-y-10 md:h-[740px] md:gap-x-14 md:gap-y-14">
          <svg className="pointer-events-none absolute inset-0 z-0 size-full" aria-hidden="true">
            {connections.map((connection) => {
              const active = Boolean(parts[connection.type]);
              return <g key={connection.type}>
                <line x1={connection.x1} y1={connection.y1} x2={connection.x2} y2={connection.y2} className={active ? "stroke-primary/60" : "stroke-border"} strokeWidth={active ? 2 : 1.5} strokeDasharray={active ? undefined : "5 7"} />
                {active && !reducedMotion && <motion.circle
                  r={4}
                  className="fill-primary"
                  style={{ filter: "drop-shadow(0 0 5px currentColor)" }}
                  initial={{ cx: connection.x1, cy: connection.y1, opacity: 0 }}
                  animate={{ cx: [connection.x1, connection.x2], cy: [connection.y1, connection.y2], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.7, repeat: Infinity, ease: "linear", delay: connection.type * 0.13 }}
                />}
              </g>;
            })}
          </svg>
          {SLOTS.map((slot) => {
            const product = parts[slot.type];
            const disabled = busy || (slot.type !== PcComponentType.Mainboard && !mainboard)
              || (slot.type === PcComponentType.PowerSupply && SLOTS.filter((part) => part.type !== PcComponentType.PowerSupply && parts[part.type]).length !== 7);
            const isMainboard = slot.type === PcComponentType.Mainboard;
            const Icon = slot.icon;
            return <Card key={slot.type} data-pc-slot={slot.type} className={`relative z-10 min-w-0 w-full gap-0 place-self-center overflow-hidden py-0 ${slot.position} ${isMainboard ? "h-full max-w-[420px] border-2 border-primary bg-primary/5 shadow-lg shadow-primary/10" : "h-[135px] max-w-[190px] bg-card sm:h-[145px] md:h-[160px]"} ${disabled ? "opacity-50" : ""}`}>
              <button type="button" disabled={disabled} onClick={() => openSlot(slot.type)} aria-label={t(product ? "replaceComponent" : "chooseComponent", { component: slotLabel(slot.type) })} className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-center transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:gap-2 sm:px-3">
                <span className={`flex flex-wrap items-center justify-center gap-1 font-semibold ${isMainboard ? "text-xs sm:text-lg" : "text-[10px] sm:text-sm"}`}><Icon className={isMainboard ? "size-5 shrink-0 sm:size-7" : "size-4 shrink-0"} />{t(`components.${slot.key}`)}</span>
                {product ? <><div className={`relative shrink-0 ${isMainboard ? "size-16 sm:size-24" : "size-9 sm:size-12"}`}><Image src={productImage(product)} alt={product.productName} fill sizes={isMainboard ? "96px" : "48px"} className="object-contain" unoptimized /></div><span className={`line-clamp-2 break-words leading-snug ${isMainboard ? "text-xs sm:text-sm" : "text-[9px] sm:text-xs"}`}>{product.productName}</span><span className={`font-semibold text-primary ${isMainboard ? "text-xs sm:text-base" : "text-[9px] sm:text-xs"}`}>{price(productPrice(product))}</span></> : <><span className={`flex items-center justify-center rounded-full border border-dashed border-primary/40 text-primary ${isMainboard ? "size-14 sm:size-20" : "size-8 sm:size-11"}`}>{disabled ? <Lock className="size-4" /> : <Plus className={isMainboard ? "size-7 sm:size-9" : "size-4 sm:size-5"} />}</span><span className={`text-muted-foreground ${isMainboard ? "text-xs sm:text-sm" : "text-[9px] sm:text-xs"}`}>{isMainboard ? t("startHere") : !mainboard ? t("locked") : slot.type === PcComponentType.PowerSupply && disabled ? t("psuLast") : t("select")}</span></>}
              </button>
              {product && <Button variant="ghost" size="sm" className="h-7 shrink-0 rounded-none text-xs" disabled={busy} aria-label={t("removeComponent", { component: slotLabel(slot.type) })} onClick={() => {
                if (isMainboard) setConfirmation({ kind: "clear" });
                else setParts((current) => { const next = { ...current }; delete next[slot.type]; if (slot.type !== PcComponentType.PowerSupply) delete next[PcComponentType.PowerSupply]; return next; });
              }}><Trash2 className="size-3" /><span className="hidden sm:inline">{t("remove")}</span></Button>}
            </Card>;
          })}
          <div className="z-10 col-start-1 row-start-3 flex flex-col items-center justify-center gap-2 text-center text-muted-foreground"><CircuitBoard className="size-7 opacity-40" /><span className="text-xs font-medium sm:text-sm">{t("progress", { count: selection.length })}</span><span className="hidden max-w-40 text-xs sm:block">{t("selectMainboard")}</span></div>
        </div>
      </div>

      <p className="mt-5 text-xs leading-6 text-muted-foreground">{t("compatibilityNote")}</p>

      <div className="fixed inset-x-3 bottom-3 z-30 mx-auto max-w-7xl rounded-2xl border bg-card/95 p-4 shadow-xl backdrop-blur md:bottom-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-5"><div><p className="text-xs text-muted-foreground">{t("totalPrice")}</p><strong className="text-xl text-primary md:text-2xl">{price(totalPrice)}</strong></div><div><p className="text-xs text-muted-foreground">{t("totalTdp")}</p><strong className="flex items-center gap-1 text-base"><Zap className="size-4" />{totalTdp.toLocaleString(locale, { maximumFractionDigits: 2 })} W</strong><p className="text-xs text-muted-foreground">{t("minimumPsu", { watt: requiredWatt })}</p></div></div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button variant="outline" className="h-auto min-h-9 min-w-0 flex-1 whitespace-normal text-xs sm:flex-none sm:text-sm" disabled={!mainboard || busy || (buildId === null && (builds.data?.length ?? 0) >= 10)} onClick={() => setSaveOpen(true)}><Save />{t("saveBuild")}</Button>
            <Button className="h-auto min-h-9 min-w-0 flex-1 whitespace-normal text-xs sm:flex-none sm:text-sm" disabled={selection.length !== SLOTS.length || busy} onClick={() => router.push(`/checkout?pcBuilder=1&products=${selection.join(",")}`)}><CreditCard />{t("checkout")}</Button>
          </div>
        </div>
        {buildId === null && (builds.data?.length ?? 0) >= 10 && <p className="mt-2 text-xs text-destructive">{t("limitReached")}</p>}
      </div>

      <Dialog open={choosing !== null} onOpenChange={(open) => { if (!open) setChoosing(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader><DialogTitle>{t("chooseComponent", { component: choosingSlot ? t(`components.${choosingSlot.key}`) : "" })}</DialogTitle><DialogDescription>{t("compatibleOnly")}</DialogDescription></DialogHeader>
          <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchProducts")} aria-label={t("searchProducts")} />
          {recommendations.isFetching ? <div className="flex justify-center gap-2 py-10"><LoaderCircle className="size-5 animate-spin" />{t("loading")}</div>
            : recommendations.isError ? <Alert variant="destructive"><AlertDescription>{errorMessage(recommendations.error.message)}<Button className="ml-2" variant="outline" size="sm" onClick={() => void recommendations.refetch()}>{t("retry")}</Button></AlertDescription></Alert>
              : options.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{t("noCompatibleProducts")}</p>
                : <div className="space-y-3">{options.map((product) => <Card key={product.id} className="flex flex-row gap-3 p-3 sm:items-center">
                  <div className="relative size-16 shrink-0 sm:size-20"><Image src={productImage(product)} alt={product.productName} fill sizes="80px" className="object-contain" unoptimized /></div>
                  <div className="min-w-0 flex-1"><Link href={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer" className="line-clamp-2 font-medium hover:text-primary">{product.productName}</Link><p className="mt-1 text-xs text-muted-foreground">{product.sku}</p><p className="mt-1 text-xs text-muted-foreground">{product.specifications?.slice(0, 4).map((spec) => `${spec.specName}: ${spec.specValue}`).join(" · ")}</p><p className="mt-2 font-semibold text-primary">{price(productPrice(product))}</p><Button className="mt-2 sm:hidden" size="sm" onClick={() => selectPart(product)}>{t("select")}</Button></div>
                  <Button className="hidden shrink-0 sm:inline-flex" onClick={() => selectPart(product)}>{t("select")}</Button>
                </Card>)}</div>}
        </DialogContent>
      </Dialog>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}><DialogContent><DialogHeader><DialogTitle>{t("saveBuild")}</DialogTitle><DialogDescription>{t("savedHint")}</DialogDescription></DialogHeader><form onSubmit={(event) => { event.preventDefault(); if (name.trim()) saveMutation.mutate(); }} className="space-y-5"><div className="space-y-2"><Label htmlFor="pc-build-name">{t("buildName")}</Label><Input id="pc-build-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required placeholder={t("namePlaceholder")} /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setSaveOpen(false)}>{t("cancel")}</Button><Button type="submit" disabled={!name.trim() || saveMutation.isPending}>{saveMutation.isPending && <LoaderCircle className="animate-spin" />}{t("saveBuild")}</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={confirmation !== null} onOpenChange={(open) => { if (!open) setConfirmation(null); }}><DialogContent><DialogHeader><DialogTitle>{t("confirmTitle")}</DialogTitle><DialogDescription>{t(confirmation?.kind === "mainboard" ? "changeMainboardHint" : confirmation?.kind === "delete" ? "deleteHint" : "resetHint")}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setConfirmation(null)}>{t("cancel")}</Button><Button variant={confirmation?.kind === "delete" ? "destructive" : "default"} onClick={confirm}>{t("confirm")}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
