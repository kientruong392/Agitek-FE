import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminSidebar from "@/app/(admin)/components/admin/AdminSidebar";
import AdminHeader from "@/app/(admin)/components/admin/AdminHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <SidebarProvider defaultOpen><AdminSidebar user={session.user} /><SidebarInset><AdminHeader /><main className="flex-1 bg-muted/30 p-4 sm:p-6">{children}</main></SidebarInset></SidebarProvider>;
}

