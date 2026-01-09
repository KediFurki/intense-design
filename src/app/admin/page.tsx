import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingBag, Users } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Revenue" value="$45,231.89" icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Subscriptions" value="+2350" icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Active Products" value="12" icon={<Package className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Pending Orders" value="7" icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />} />
      </div>

      {/* Placeholder for Recent Orders Table */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-slate-50 rounded-md">
              Chart Placeholder
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                <div className="text-sm text-muted-foreground">No recent sales.</div>
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
        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
      </CardContent>
    </Card>
  )
}