"use client";

import { Globe, LogOutIcon, SettingsIcon, ShoppingCart, UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import ColorModeToggle from "@/components/shared/ColorModeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrentUser, logout } from "@/actions/auth.action";
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function CartButton() {
  const t = useTranslations("Header");
  return (
    <Button variant="ghost" size="icon" aria-label={t("cart")} className="relative">
      <ShoppingCart />
      <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">0</span>
    </Button>
  );
}

function LanguageMenu() {
  const t = useTranslations("Header");
  const switchLanguage = (locale: "en" | "vi") => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={t("language")} />}>
        <Globe />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("language")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => switchLanguage("en")}>English</DropdownMenuItem>
          <DropdownMenuItem onClick={() => switchLanguage("vi")}>Tiếng Việt</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function RightSection({ isLogin }: { isLogin: boolean }) {
  const router = useRouter();
  const t = useTranslations("Header");
  const { data: user } = useQuery({ queryKey: ["user"], queryFn: getCurrentUser, enabled: isLogin });

  const handleAuth = async () => {
    if (isLogin) {
      await logout();
      router.refresh();
      return;
    }
    router.push("/login");
  };

  return (
    <div className="flex shrink-0 items-center gap-1 md:gap-2">
      <CartButton />
      {!isLogin && <Button className="rounded-full font-semibold" onClick={handleAuth}>{t("login")}</Button>}
      {isLogin && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={t("login")} />}>
            <Avatar>
              <AvatarImage src={user?.avatarUrl || "/images/no-image.png"} />
              <AvatarFallback>AP</AvatarFallback>
              <AvatarBadge className="bg-green-600 dark:bg-green-800" />
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem><UserIcon />Account</DropdownMenuItem>
              <DropdownMenuItem><SettingsIcon />Settings</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuItem variant="destructive" onClick={handleAuth}><LogOutIcon />{t("logout")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <LanguageMenu />
      <ColorModeToggle />
    </div>
  );
}

