import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("Footer");
  return (
    <footer className="border-t border-border bg-muted/40 text-muted-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4 md:px-8">
        <div><Link href="/" className="text-xl font-black text-foreground">Agitek PC</Link><p className="mt-3 text-sm leading-6">{t("slogan")}</p></div>
        <div><h2 className="mb-3 font-semibold text-foreground">{t("explore")}</h2><div className="flex flex-col gap-2 text-sm"><Link href="/">{t("aboutUs")}</Link><Link href="/">{t("blog")}</Link><Link href="/">{t("careers")}</Link></div></div>
        <div><h2 className="mb-3 font-semibold text-foreground">{t("support")}</h2><div className="flex flex-col gap-2 text-sm"><Link href="/">{t("warranty")}</Link><Link href="/">{t("shipping")}</Link><Link href="/">{t("privacy")}</Link><Link href="/">{t("faq")}</Link></div></div>
        <div><h2 className="mb-3 font-semibold text-foreground">{t("contacts")}</h2><div className="space-y-2 text-sm"><p className="flex gap-2"><Mail className="size-4" /> support@agitek.vn</p><p className="flex gap-2"><Phone className="size-4" /> +84 123 456 789</p><p className="flex gap-2"><MapPin className="size-4" /> {t("address")}</p></div></div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs">© {new Date().getFullYear()} Agitek PC. {t("rights")}</div>
    </footer>
  );
}
