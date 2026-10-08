"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, Globe, Moon, Sun, XCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import { checkBackendStatus } from "@/actions/admin.action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function LanguageMenu() {
  const t = useTranslations("Header");
  const changeLocale = (locale: "vi" | "en") => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return <DropdownMenu modal={false}><DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={t("language")} />}><Globe /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuGroup><DropdownMenuLabel>{t("language")}</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onClick={() => changeLocale("vi")}>Tiáº¿ng Viá»‡t</DropdownMenuItem><DropdownMenuItem onClick={() => changeLocale("en")}>English</DropdownMenuItem></DropdownMenuGroup></DropdownMenuContent></DropdownMenu>;
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return <Button variant="ghost" size="icon" aria-label={dark ? "Light mode" : "Dark mode"} onClick={() => setTheme(dark ? "light" : "dark")}><Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" /><Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" /></Button>;
}

export default function AdminHeader() {
  const t = useTranslations("Admin");
  const pathname = usePathname();
  const status = useQuery({ queryKey: ["admin", "backend-status"], queryFn: checkBackendStatus, refetchInterval: 30_000 });
  const current = pathname.split("/").filter(Boolean).pop() ?? "dashboard";
  const label = t.has(`items.${current}`) ? t(`items.${current}`) : t("items.dashboard");

  return <header className="flex min-h-16 items-center justify-between gap-3 border-b bg-card px-4 sm:px-6"><div className="flex min-w-0 items-center gap-2"><SidebarTrigger /><div><p className="text-xs text-muted-foreground">{t("breadcrumb.management")}</p><h1 className="truncate font-semibold">{label}</h1></div></div><div className="flex items-center gap-1"><Badge variant="outline" className={status.data ? "gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700" : "gap-1.5 border-red-200 bg-red-50 text-red-700"}>{status.data ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}{status.data ? t("online") : t("down")}</Badge><LanguageMenu /><ThemeToggle /></div></header>;
}

