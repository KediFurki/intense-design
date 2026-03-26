import { auth } from "@/auth";
import { redirect } from "@/lib/i18n/routing";
import { Link } from "@/lib/i18n/routing";
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
    <div className="flex min-h-screen bg-stone-50">
      <aside className="w-64 bg-stone-900 hidden md:flex flex-col fixed h-full inset-y-0">
        <div className="p-6 border-b border-stone-700/50">
          <h2 className="text-2xl font-bold tracking-tight text-stone-50">
            Mobilya<span className="text-amber-400">Shop</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1 tracking-wide uppercase">Admin Panel</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 mt-2">
          <SidebarLink href="/admin" icon={<LayoutDashboard size={20} />} label={t('dashboard')} />
          <SidebarLink href="/admin/products" icon={<Package size={20} />} label={t('products')} />
          <SidebarLink href="/admin/categories" icon={<ListOrdered size={20} />} label={t('categories')} />
          <SidebarLink href="/admin/orders" icon={<ShoppingCart size={20} />} label={t('orders')} />
          <SidebarLink href="/admin/customers" icon={<Users size={20} />} label={t('customers')} />
          <SidebarLink href="/admin/settings" icon={<Settings size={20} />} label={t('settings')} />
          
          <div className="my-3 border-t border-stone-700/40" />
          
          <Link 
            href="/" 
            className="flex items-center gap-3 px-4 py-3 text-amber-300 bg-amber-900/20 hover:bg-amber-900/40 rounded-xl transition-colors font-semibold border border-amber-700/30"
          >
            <Store size={20} />
            <span>{t('goToShop')}</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-stone-700/40">
          <div className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-stone-300">
             <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
             {session?.user?.name}
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
      className="flex items-center gap-3 px-4 py-3 text-stone-400 hover:bg-stone-800 hover:text-amber-300 rounded-xl transition-colors font-medium"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}