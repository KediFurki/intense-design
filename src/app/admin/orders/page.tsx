import { db } from "@/server/db";
import { orders } from "@/server/db/schema";
import { desc } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderActions } from "@/components/admin/order-actions";
import { MapPin, User } from "lucide-react";

export default async function AdminOrdersPage() {
  const ordersList = await db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    with: {
      items: {
        with: {
          product: true,
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Orders Management</h1>
      </div>

      <div className="grid gap-6">
        {ordersList.length === 0 ? (
            <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                    No orders found yet.
                </CardContent>
            </Card>
        ) : (
            ordersList.map((order) => (
                <Card key={order.id} className="overflow-hidden border border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b py-4">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">Order #{order.id.slice(0, 8)}</Badge>
                                    <span className="text-sm text-slate-500">{order.createdAt?.toLocaleDateString()}</span>
                                </div>
                                
                                <div>
                                    <div className="flex items-center gap-2 font-semibold text-slate-900 text-lg">
                                        <User size={18} className="text-blue-600" />
                                        {order.customerName}
                                    </div>
                                    <div className="text-sm text-slate-600 ml-6 space-y-0.5">
                                        <p>{order.customerEmail}</p>
                                        <p>{order.customerPhone}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 text-sm text-slate-500 mt-2 p-2 bg-white rounded border border-slate-200">
                                    <MapPin size={16} className="shrink-0 mt-0.5 text-slate-400" />
                                    <span>
                                        {order.address}<br/>
                                        {order.zipCode} {order.city} / {order.state}<br/>
                                        <span className="font-semibold text-slate-700">{order.country}</span>
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Total Amount</p>
                                    <p className="font-bold text-xl text-slate-900">€{(order.totalAmount / 100).toFixed(2)}</p>
                                </div>
                                <OrderActions 
                                    orderId={order.id} 
                                    currentStatus={order.status || "pending"} 
                                />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Unit Price</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium text-slate-700">
                                            {item.product?.name || "Deleted Product"}
                                        </TableCell>
                                        <TableCell className="text-right text-slate-500">€{(item.price / 100).toFixed(2)}</TableCell>
                                        <TableCell className="text-right">x{item.quantity}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            €{((item.price * item.quantity) / 100).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ))
        )}
      </div>
    </div>
  );
}