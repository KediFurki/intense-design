import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Package, ShoppingBag, AlertTriangle, ArrowRight } from "lucide-react";
import { db } from "@/server/db";
import { orders, products } from "@/server/db/schema";
import { count, sum, desc, gt, lt, and, eq } from "drizzle-orm";
import { Link } from "@/lib/i18n/routing";
import { DashboardActions } from "@/components/admin/dashboard-actions";
import { getTranslations } from "next-intl/server";

export default async function AdminDashboardPage() {
  const t = await getTranslations("Admin");

  const [revenueResult] = await db.select({ value: sum(orders.totalAmount) }).from(orders);
  const totalRevenue = revenueResult.value ? Number(revenueResult.value) : 0;
  
  const [activeProductsResult] = await db.select({ count: count() }).from(products).where(gt(products.stock, 0));
  const [lowStockResult] = await db.select({ count: count() }).from(products).where(and(gt(products.stock, 0), lt(products.stock, 5)));
  const [ordersResult] = await db.select({ count: count() }).from(orders);

  const recentOrders = await db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    limit: 5,
    with: { items: true }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 print:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-900">{t('dashboard')}</h1>
            <p className="text-stone-500">{t('overview')}</p>
        </div>
        <DashboardActions />
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
            title={t('totalRevenue')} 
            value={`€ ${(totalRevenue / 100).toFixed(2)}`} 
            icon={<DollarSign className="h-5 w-5 text-amber-700" />} 
            accent="bg-amber-50 border-amber-200"
        />
        <StatsCard 
            title={t('totalOrders')} 
            value={ordersResult.count.toString()} 
            icon={<ShoppingBag className="h-5 w-5 text-stone-600" />} 
            accent="bg-stone-50 border-stone-200"
        />
        <StatsCard 
            title={t('activeProducts')} 
            value={activeProductsResult.count.toString()} 
            icon={<Package className="h-5 w-5 text-emerald-700" />} 
            accent="bg-emerald-50 border-emerald-200"
        />
        <StatsCard 
            title={t('lowStock')} 
            value={lowStockResult.count.toString()} 
            icon={<AlertTriangle className="h-5 w-5 text-orange-600" />} 
            accent="bg-orange-50 border-orange-200"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* RECENT ORDERS TABLE */}
        <Card className="col-span-4 border-stone-200 rounded-2xl shadow-sm print:col-span-7 print:shadow-none print:border-none">
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-stone-900">{t('recentOrders')}</CardTitle>
                </div>
                <Link href="/admin/orders" className="print:hidden">
                    <Button variant="ghost" size="sm" className="gap-1 text-amber-800 hover:text-amber-900 hover:bg-amber-50">
                        {t('viewAll')} <ArrowRight size={14} />
                    </Button>
                </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow className="bg-stone-50 hover:bg-stone-50">
                        <TableHead className="pl-6 text-stone-600">{t('orderId')}</TableHead>
                        <TableHead className="text-stone-600">{t('customer')}</TableHead>
                        <TableHead className="text-stone-600">{t('status')}</TableHead>
                        <TableHead className="text-right pr-6 text-stone-600">{t('amount')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentOrders.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-stone-400">
                                {t('noOrders') || "No orders yet."}
                            </TableCell>
                        </TableRow>
                    ) : (
                        recentOrders.map((order) => (
                            <TableRow key={order.id} className="hover:bg-stone-50/50">
                                <TableCell className="font-medium pl-6 text-stone-700">
                                    #{order.id.slice(0, 8)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-stone-900">{order.customerName}</span>
                                        <span className="text-xs text-stone-400">{order.customerEmail}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={order.status || "pending"} />
                                </TableCell>
                                <TableCell className="text-right pr-6 font-bold text-stone-900">
                                    €{(order.totalAmount / 100).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* STORE OVERVIEW */}
        <Card className="col-span-3 border-stone-200 rounded-2xl shadow-sm print:hidden">
          <CardHeader>
            <CardTitle className="text-stone-900">{t('storeOverview')}</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-6">
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-stone-700">{t('stockUtilization')}</span>
                        <span className="text-stone-500">85%</span>
                    </div>
                    <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-600 w-[85%] rounded-full transition-all" />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-stone-700">{t('salesTarget')}</span>
                        <span className="text-stone-500">€{(totalRevenue/100).toFixed(0)} / €10,000</span>
                    </div>
                    <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(((totalRevenue/100) / 10000) * 100, 100)}%` }} />
                    </div>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, description, accent }: { title: string; value: string; icon: React.ReactNode; description?: string; accent?: string }) {
  return (
    <Card className={`rounded-2xl shadow-sm ${accent || 'border-stone-200'}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-stone-600">{title}</CardTitle>
        <div className="rounded-lg bg-white/60 p-2">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-stone-900">{value}</div>
        {description && <p className="text-xs text-stone-500 mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
        processing: "bg-sky-100 text-sky-700 hover:bg-sky-100",
        shipped: "bg-violet-100 text-violet-700 hover:bg-violet-100",
        delivered: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
        cancelled: "bg-red-100 text-red-700 hover:bg-red-100",
    };

    return (
        <Badge className={`${styles[status] || "bg-stone-100 text-stone-700"} border-none shadow-none font-medium capitalize`}>
            {status}
        </Badge>
    );
}