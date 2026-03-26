import { db } from "@/server/db";
import { orders } from "@/server/db/schema";
import { desc } from "drizzle-orm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OrderActions } from "@/components/admin/order-actions";
import { MapPin, User, Building2 } from "lucide-react";
import { PrintOrderButton } from "@/components/admin/print-order-button";
import { getLocale } from "next-intl/server";

export default async function AdminOrdersPage() {
  const locale = await getLocale();
  
  const ordersList = await db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    with: { items: { with: { product: true } } }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getLocalized = (data: any) => {
    if (!data) return "Unknown Product";
    if (typeof data === "string") return data;
    return data[locale] || data['en'] || Object.values(data)[0] || "Product";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Orders Management</h1>
          <p className="text-stone-500">{ordersList.length} order{ordersList.length !== 1 ? 's' : ''} total</p>
        </div>
      </div>

      <div className="grid gap-6">
        {ordersList.map((order) => (
            <Card key={order.id} className="overflow-hidden border border-stone-200 rounded-2xl shadow-sm print:shadow-none print:border-black">
                <CardHeader className="bg-stone-50/60 border-b border-stone-200 py-4 print:bg-white print:border-none">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs bg-white border-stone-300 text-stone-700">Order #{order.id.slice(0, 8)}</Badge>
                                <span className="text-sm text-stone-400">{order.createdAt?.toLocaleDateString()}</span>
                                <Badge className={`capitalize ${order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'} border-none`}>
                                    {order.status}
                                </Badge>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4 mt-2">
                                <div>
                                    <div className="flex items-center gap-2 font-semibold text-stone-900">
                                        <User size={16} className="text-amber-700" /> {order.customerName}
                                    </div>
                                    <div className="text-sm text-stone-600 ml-6">
                                        <p>{order.customerEmail}</p>
                                        <p>{order.customerPhone}</p>
                                        <div className="flex items-start gap-1 mt-1 text-stone-400">
                                            <MapPin size={14} className="mt-0.5 shrink-0" />
                                            <span>{order.address},<br/>{order.zipCode} {order.city} / {order.country}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-sm bg-white p-3 rounded-xl border border-stone-200 print:border-black">
                                    <h4 className="font-semibold flex items-center gap-2 text-stone-900 mb-2">
                                        {order.invoiceType === 'corporate' ? <Building2 size={14}/> : <User size={14}/>} 
                                        {order.invoiceType === 'corporate' ? 'Business Invoice' : 'Personal Receipt'}
                                    </h4>
                                    
                                    {order.invoiceType === 'corporate' ? (
                                        <div className="space-y-1 text-stone-600">
                                            <p><span className="font-medium text-stone-900">Company:</span> {order.companyName}</p>
                                            <p><span className="font-medium text-stone-900">VAT:</span> {order.taxId}</p>
                                        </div>
                                    ) : (
                                        <p className="text-stone-400 italic">No additional tax details.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 print:hidden">
                            <div className="text-right">
                                <p className="text-xs text-stone-400">Total Amount</p>
                                <p className="font-bold text-xl text-stone-900">€{(order.totalAmount / 100).toFixed(2)}</p>
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
                            <TableRow className="bg-stone-50/50 hover:bg-stone-50/50"><TableHead className="text-stone-600">Product</TableHead><TableHead className="text-right text-stone-600">Price</TableHead><TableHead className="text-right text-stone-600">Qty</TableHead><TableHead className="text-right text-stone-600">Total</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                            {order.items.map((item) => (
                                <TableRow key={item.id} className="hover:bg-stone-50/30">
                                    <TableCell>
                                        <div className="font-medium text-stone-900">
                                            {getLocalized(item.product?.name)}
                                        </div>
                                        {item.variantName && item.variantName !== "Standard" && (
                                            <div className="text-xs font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full w-fit mt-1 border border-amber-200">
                                                {item.variantName}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right text-stone-700">€{(item.price / 100).toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-stone-700">x{item.quantity}</TableCell>
                                    <TableCell className="text-right font-bold text-stone-900">€{((item.price * item.quantity) / 100).toFixed(2)}</TableCell>
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