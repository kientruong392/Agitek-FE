import Link from "next/link";
import { LayoutDashboard, Users, Settings, LogOut } from "lucide-react";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-primary">Admin Panel</h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/admin" className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-primary/10 text-primary transition-colors">
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/admin/users" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <Users size={20} />
            <span className="font-medium">Users</span>
          </Link>
          <Link href="/admin/settings" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-border">
          <button className="flex w-full items-center space-x-3 px-3 py-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-muted/30">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
