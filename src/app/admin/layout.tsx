import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Store } from "lucide-react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // SECURITY CHECK: Java'daki @PreAuthorize("hasRole('ADMIN')") gibi
  if (!session?.user || session.user.role !== "admin") {
    redirect("/"); // Admin değilse ana sayfaya postala
  }

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* SIDEBAR - SOL MENÜ */}
      <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col fixed h-full inset-y-0">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Admin<span className="text-blue-600">Panel</span>
          </h2>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarLink href="/admin" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <SidebarLink href="/admin/products" icon={<Package size={20} />} label="Products" />
          <SidebarLink href="/admin/orders" icon={<ShoppingCart size={20} />} label="Orders" />
          <SidebarLink href="/admin/customers" icon={<Users size={20} />} label="Customers" />
          <SidebarLink href="/admin/settings" icon={<Settings size={20} />} label="Settings" />
          {/* AYIRAÇ ÇİZGİ */}
  <div className="my-2 border-t border-slate-200 dark:border-slate-800" />
  
  {/* MAĞAZAYA GİT BUTONU */}
  <Link 
    href="/" 
    className="flex items-center gap-3 px-4 py-3 text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors font-bold border border-green-200"
  >
    <Store size={20} />
    <span>Go to Shop</span>
  </Link>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600">
             <div className="w-2 h-2 rounded-full bg-green-500"></div>
             {session.user.name}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT - SAĞ TARAF */}
      <main className="flex-1 md:ml-64 p-8">
        {children}
      </main>
    </div>
  );
}

// Helper Component for Sidebar Links
function SidebarLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-blue-600 dark:hover:text-blue-500 rounded-lg transition-colors font-medium"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}