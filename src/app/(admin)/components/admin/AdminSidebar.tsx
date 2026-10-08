"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import {
  BarChart3, Boxes, CreditCard, FileText, FolderTree, LayoutDashboard, LogOut, MapPin,
  MessageSquare, Package, RefreshCcw, ShieldCheck, ShoppingBag, UserRound,
  Users, WalletCards,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import type { UserPayload } from "next-auth";

type Role = "SuperAdmin" | "Admin" | "Manager" | "Delivery" | "Staff";
type NavItem = { label: string; href: string; icon: typeof LayoutDashboard; roles?: Role[] };
type NavGroup = { label: string; items: NavItem[] };

const managementRoles: Role[] = ["SuperAdmin", "Admin", "Manager"];
const staffRoles: Role[] = ["SuperAdmin", "Admin", "Manager", "Staff"];

const groups: NavGroup[] = [
  {
    label: "catalog",
    items: [
{ label: "products", href: "/admin/products", icon: Package, roles: staffRoles },
      { label: "categories", href: "/admin/categories", icon: FolderTree, roles: staffRoles },
      { label: "brands", href: "/admin/brands", icon: Boxes, roles: staffRoles },
    ],
  },
  {
    label: "sales",
    items: [
      { label: "orders", href: "/admin/orders", icon: ShoppingBag, roles: [...managementRoles, "Delivery"] },
      { label: "payments", href: "/admin/payments", icon: CreditCard, roles: managementRoles },
      { label: "refunds", href: "/admin/refunds", icon: RefreshCcw, roles: managementRoles },
    ],
  },
  {
    label: "users",
    items: [
      { label: "staff", href: "/admin/staff", icon: Users, roles: managementRoles },
      { label: "customers", href: "/admin/customers", icon: UserRound, roles: managementRoles },
    ],
  },
  {
    label: "interactions",
    items: [
      { label: "vouchers", href: "/admin/vouchers", icon: WalletCards, roles: staffRoles },
      { label: "reviews", href: "/admin/reviews", icon: MessageSquare, roles: staffRoles },
      { label: "warranties", href: "/admin/warranties", icon: ShieldCheck, roles: staffRoles },
    ],
  },
  {
    label: "system",
    items: [
      { label: "locations", href: "/admin/locations", icon: MapPin, roles: managementRoles },
      { label: "audit-logs", href: "/admin/audit-logs", icon: FileText, roles: managementRoles },
      { label: "reports", href: "/admin/reports", icon: BarChart3, roles: managementRoles },
    ],
  },
];

const menuButton = "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground";

export default function AdminSidebar({ user }: { user: UserPayload }) {
  const t = useTranslations("Admin");
  const pathname = usePathname();
  const router = useRouter();
  const role = (user.role ?? "Staff") as Role;
  const displayName = user.name ?? user.username;

  return (
    <Sidebar
      collapsible="icon"
      className=""
    >
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Agitek Admin" render={<Link href="/admin" />} className={menuButton}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary font-black text-sidebar-primary-foreground">A</span>
              <span className="font-bold">Agitek Admin</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={t("items.dashboard")}
                  isActive={pathname === "/admin"}
                  render={<Link href="/admin" />}
                  className={menuButton}
                >
                  <LayoutDashboard />
                  <span>{t("items.dashboard")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {groups.map((group) => {
          const items = group.items.filter((item) => !item.roles || item.roles.includes(role));
          if (!items.length) return null;

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-sidebar-foreground/60">{t(`groups.${group.label}`)}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          tooltip={t(`items.${item.label}`)}
                          isActive={pathname.startsWith(item.href)}
                          render={<Link href={item.href} />}
                          className={menuButton}
                        >
                          <Icon />
                          <span>{t(`items.${item.label}`)}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="gap-2 p-3">
        <div className="flex items-center gap-3 rounded-lg p-2 group-data-[collapsible=icon]:justify-center">
          <Avatar className="size-8">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{user.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive group-data-[collapsible=icon]:justify-center"
          onClick={() => { void signOut({ redirect: false }).then(() => router.push("/login")); }}
        >
          <LogOut />
          <span className="group-data-[collapsible=icon]:hidden">{t("logout")}</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

