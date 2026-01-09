import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingBag, Users } from "lucide-react";
import { db } from "@/server/db";
import { orders, products, users } from "@/server/db/schema";
import { count, sum, eq } from "drizzle-orm";

export default async function AdminDashboardPage() {
  
  // 1. Toplam Ciro
  const [revenueResult] = await db.select({ value: sum(orders.totalAmount) }).from(orders);
  const totalRevenue = revenueResult.value ? Number(revenueResult.value) : 0;

  // 2. Toplam Ürün Sayısı
  const [productsResult] = await db.select({ count: count() }).from(products);
  
  // 3. Toplam Sipariş Sayısı
  const [ordersResult] = await db.select({ count: count() }).from(orders);

  // 4. Bekleyen Siparişler
  const [pendingOrdersResult] = await db.select({ count: count() }).from(orders).where(eq(orders.status, "pending"));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      </div>

      {/* KPI CARDS - GERÇEK VERİLER */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
            title="Total Revenue" 
            value={`€ ${(totalRevenue / 100).toFixed(2)}`} 
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} 
        />
        <StatsCard 
            title="Total Orders" 
            value={ordersResult.count.toString()} 
            icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />} 
        />
        <StatsCard 
            title="Products in Stock" 
            value={productsResult.count.toString()} 
            icon={<Package className="h-4 w-4 text-muted-foreground" />} 
        />
        <StatsCard 
            title="Pending Orders" 
            value={pendingOrdersResult.count.toString()} 
            icon={<Users className="h-4 w-4 text-muted-foreground" />} 
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-slate-50 rounded-md border border-dashed">
              Chart Placeholder (Recharts can be added here)
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                    System is active. {ordersResult.count} orders processed.
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">Updated just now</p>
      </CardContent>
    </Card>
  )
}