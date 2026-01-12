import { auth } from "@/auth";
import { redirect } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings,
  ListOrdered,
  Store 
} from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const t = await getTranslations("Admin");

  if (!session?.user || session.user.role !== "admin") {
    redirect({href: "/", locale: "en"});
  }

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900">
      <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col fixed h-full inset-y-0">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Admin<span className="text-blue-600">Panel</span>
          </h2>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarLink href="/admin" icon={<LayoutDashboard size={20} />} label={t('dashboard')} />
          <SidebarLink href="/admin/products" icon={<Package size={20} />} label={t('products')} />
          <SidebarLink href="/admin/categories" icon={<ListOrdered size={20} />} label={t('categories')} />
          <SidebarLink href="/admin/orders" icon={<ShoppingCart size={20} />} label={t('orders')} />
          <SidebarLink href="/admin/customers" icon={<Users size={20} />} label={t('customers')} />
          <SidebarLink href="/admin/settings" icon={<Settings size={20} />} label={t('settings')} />
          
          <div className="my-2 border-t border-slate-200 dark:border-slate-800" />
          
          <Link 
            href="/" 
            className="flex items-center gap-3 px-4 py-3 text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors font-bold border border-green-200"
          >
            <Store size={20} />
            <span>{t('goToShop')}</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600">
             <div className="w-2 h-2 rounded-full bg-green-500"></div>
             {session?.user?.name} {/* DÜZELTME: Güvenli erişim */}
          </div>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-8">
        {children}
      </main>
    </div>
  );
}

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