import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Package, ShoppingBag, AlertTriangle, ArrowRight } from "lucide-react";
import { db } from "@/server/db";
import { orders, products } from "@/server/db/schema";
import { count, sum, desc, gt, lt, and, eq } from "drizzle-orm";
import { Link } from "@/lib/i18n/routing"; // DÜZELTME: i18n uyumlu Link
import { DashboardActions } from "@/components/admin/dashboard-actions";
import { getTranslations } from "next-intl/server"; // DÜZELTME: Çeviri fonksiyonu

export default async function AdminDashboardPage() {
  const t = await getTranslations("Admin"); // Çevirileri yükle

  // Veritabanı sorguları
  const [revenueResult] = await db.select({ value: sum(orders.totalAmount) }).from(orders);
  const totalRevenue = revenueResult.value ? Number(revenueResult.value) : 0;
  
  const [activeProductsResult] = await db.select({ count: count() }).from(products).where(gt(products.stock, 0));
  const [lowStockResult] = await db.select({ count: count() }).from(products).where(and(gt(products.stock, 0), lt(products.stock, 5)));
  const [ordersResult] = await db.select({ count: count() }).from(orders);

  // Son Siparişler
  const recentOrders = await db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    limit: 5,
    with: { items: true }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 print:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('dashboard')}</h1>
            <p className="text-muted-foreground">{t('overview')}</p>
        </div>
        <DashboardActions />
      </div>

      {/* KPI KARTLARI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
            title={t('totalRevenue')} 
            value={`€ ${(totalRevenue / 100).toFixed(2)}`} 
            icon={<DollarSign className="h-4 w-4 text-slate-600" />} 
        />
        <StatsCard 
            title={t('totalOrders')} 
            value={ordersResult.count.toString()} 
            icon={<ShoppingBag className="h-4 w-4 text-blue-600" />} 
        />
        <StatsCard 
            title={t('activeProducts')} 
            value={activeProductsResult.count.toString()} 
            icon={<Package className="h-4 w-4 text-purple-600" />} 
        />
        <StatsCard 
            title={t('lowStock')} 
            value={lowStockResult.count.toString()} 
            icon={<AlertTriangle className="h-4 w-4 text-orange-600" />} 
            className="border-orange-200 bg-orange-50/50"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* SON SİPARİŞLER TABLOSU */}
        <Card className="col-span-4 border-slate-200 shadow-sm print:col-span-7 print:shadow-none print:border-none">
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>{t('recentOrders')}</CardTitle>
                </div>
                <Link href="/admin/orders" className="print:hidden">
                    <Button variant="ghost" size="sm" className="gap-1 text-blue-600 hover:text-blue-700">
                        {t('viewAll')} <ArrowRight size={14} />
                    </Button>
                </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="pl-6">{t('orderId')}</TableHead>
                        <TableHead>{t('customer')}</TableHead>
                        <TableHead>{t('status')}</TableHead>
                        <TableHead className="text-right pr-6">{t('amount')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentOrders.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                {t('noOrders') || "No orders yet."}
                            </TableCell>
                        </TableRow>
                    ) : (
                        recentOrders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium pl-6">
                                    #{order.id.slice(0, 8)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-900">{order.customerName}</span>
                                        <span className="text-xs text-slate-500">{order.customerEmail}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={order.status || "pending"} />
                                </TableCell>
                                <TableCell className="text-right pr-6 font-bold">
                                    €{(order.totalAmount / 100).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* SAĞ TARAF: STORE OVERVIEW */}
        <Card className="col-span-3 border-slate-200 shadow-sm print:hidden">
          <CardHeader>
            <CardTitle>{t('storeOverview')}</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-6">
                
                {/* Inventory Bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{t('stockUtilization')}</span>
                        <span className="text-slate-500">85%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 w-[85%] rounded-full" />
                    </div>
                </div>

                {/* Sales Target */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{t('salesTarget')}</span>
                        <span className="text-slate-500">€{(totalRevenue/100).toFixed(0)} / €10,000</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(((totalRevenue/100) / 10000) * 100, 100)}%` }} />
                    </div>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper Components
function StatsCard({ title, value, icon, description, className }: { title: string; value: string; icon: React.ReactNode, description?: string, className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        pending: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
        processing: "bg-blue-100 text-blue-700 hover:bg-blue-100",
        shipped: "bg-purple-100 text-purple-700 hover:bg-purple-100",
        delivered: "bg-green-100 text-green-700 hover:bg-green-100",
        cancelled: "bg-red-100 text-red-700 hover:bg-red-100",
    };

    return (
        <Badge className={`${styles[status] || "bg-slate-100 text-slate-700"} border-none shadow-none font-medium capitalize`}>
            {status}
        </Badge>
    );
}