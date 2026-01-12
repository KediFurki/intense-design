import { db } from "@/server/db";
import { orders } from "@/server/db/schema";
import { desc } from "drizzle-orm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OrderActions } from "@/components/admin/order-actions";
import { MapPin, User, Building2 } from "lucide-react";
import { PrintOrderButton } from "@/components/admin/print-order-button";

export default async function AdminOrdersPage() {
  const ordersList = await db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    with: { items: { with: { product: true } } }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Orders Management</h1>
      </div>

      <div className="grid gap-6">
        {ordersList.map((order) => (
            <Card key={order.id} className="overflow-hidden border border-slate-200 shadow-sm print:shadow-none print:border-black">
                <CardHeader className="bg-slate-50/50 border-b py-4 print:bg-white print:border-none">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">Order #{order.id.slice(0, 8)}</Badge>
                                <span className="text-sm text-slate-500">{order.createdAt?.toLocaleDateString()}</span>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4 mt-2">
                                <div>
                                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                                        <User size={16} className="text-blue-600" /> {order.customerName}
                                    </div>
                                    <div className="text-sm text-slate-600 ml-6">
                                        <p>{order.customerEmail}</p>
                                        <p>{order.customerPhone}</p>
                                        <div className="flex items-start gap-1 mt-1 text-slate-500">
                                            <MapPin size={14} className="mt-0.5 shrink-0" />
                                            <span>{order.address},<br/>{order.zipCode} {order.city} / {order.country}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-sm bg-blue-50/50 p-3 rounded border border-blue-100 print:border-black print:bg-white">
                                    <h4 className="font-semibold flex items-center gap-2 text-blue-900 mb-2">
                                        {order.invoiceType === 'corporate' ? <Building2 size={14}/> : <User size={14}/>} 
                                        {order.invoiceType === 'corporate' ? 'Business Invoice' : 'Personal Receipt'}
                                    </h4>
                                    
                                    {order.invoiceType === 'corporate' ? (
                                        <div className="space-y-1">
                                            <p><span className="font-medium text-slate-700">Company:</span> {order.companyName}</p>
                                            <p><span className="font-medium text-slate-700">VAT Number:</span> {order.taxId}</p>
                                            {order.taxOffice && <p><span className="font-medium text-slate-700">Office:</span> {order.taxOffice}</p>}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 italic">No additional tax details required.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 print:hidden">
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Total Amount</p>
                                <p className="font-bold text-xl text-slate-900">€{(order.totalAmount / 100).toFixed(2)}</p>
                            </div>
                            <div className="flex gap-2">
                                <PrintOrderButton />
                                <OrderActions orderId={order.id} currentStatus={order.status || "pending"} />
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow><TableHead>Product</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Total</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                            {order.items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="font-medium">{item.product?.name}</div>
                                        {/* GÜNCELLEME: Varyasyon adını göster */}
                                        {item.variantName && <div className="text-xs text-muted-foreground">{item.variantName}</div>}
                                    </TableCell>
                                    <TableCell className="text-right">€{(item.price / 100).toFixed(2)}</TableCell>
                                    <TableCell className="text-right">x{item.quantity}</TableCell>
                                    <TableCell className="text-right font-bold">€{((item.price * item.quantity) / 100).toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}