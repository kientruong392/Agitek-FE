import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "vi", namespace: "Layout" });
  return { title: t("title"), description: t("description") };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={cn("h-full antialiased font-sans", geistSans.variable, geistMono.variable, inter.variable)} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NextIntlClientProvider><Providers>{children}</Providers></NextIntlClientProvider>
      </body>
    </html>
  );
}
