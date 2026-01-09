"use client";

import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Truck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createOrder } from "@/server/actions/order";

export default function CheckoutPage() {
  const cart = useCart();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  if (cart.items.length === 0) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Cart is empty</h2>
            <Link href="/">
                <Button>Go Shopping</Button>
            </Link>
        </div>
    )
  }

  const totalPrice = cart.items.reduce((total, item) => total + (Number(item.price) * item.quantity), 0);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
    const orderData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      country: formData.get("country") as string,
      state: formData.get("state") as string,
      city: formData.get("city") as string,
      zipCode: formData.get("zipCode") as string,
      items: cart.items.map(item => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity
      }))
    };

    const result = await createOrder(orderData);

    if (result.success) {
        cart.removeAll();
        toast.success("Order received! 🚀");
        router.push("/admin/orders");
    } else {
        toast.error(result.error || "Something went wrong.");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-8 transition-colors"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Store</Link>

        <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3 space-y-8">
                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-blue-600" /> Shipping Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form id="checkout-form" onSubmit={onSubmit} className="grid gap-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>First Name</Label><Input name="firstName" placeholder="John" required /></div>
                                <div className="space-y-2"><Label>Last Name</Label><Input name="lastName" placeholder="Doe" required /></div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" placeholder="john@example.com" required /></div>
                                <div className="space-y-2"><Label>Phone Number</Label><Input name="phone" type="tel" placeholder="+90 555..." required /></div>
                            </div>

                            <div className="space-y-2"><Label>Country</Label><Input name="country" placeholder="Turkey" required /></div>
                            <div className="space-y-2"><Label>Address Line</Label><Input name="address" placeholder="123 Furniture St." required /></div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2"><Label>City</Label><Input name="city" placeholder="Istanbul" required /></div>
                                <div className="space-y-2"><Label>State / Province</Label><Input name="state" placeholder="Besiktas" required /></div>
                                <div className="space-y-2"><Label>Zip Code</Label><Input name="zipCode" placeholder="34000" required /></div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md">
                    <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-blue-600" /> Payment Method</CardTitle></CardHeader>
                    <CardContent>
                        <div className="p-4 border rounded-lg bg-slate-50 flex items-center justify-between cursor-pointer border-blue-200 ring-1 ring-blue-200">
                            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full" /></div><span className="font-medium text-slate-900">Credit Card (Mock)</span></div>
                            <CreditCard className="text-slate-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <Card className="border-none shadow-md sticky top-24">
                    <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            {cart.items.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-slate-100 shrink-0">
                                        {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                                        <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                                    </div>
                                    <div className="font-medium text-sm">€{((item.price * item.quantity) / 100).toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                        <Separator />
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>€{(totalPrice / 100).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span className="text-green-600 font-medium">Free</span></div>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center font-bold text-lg"><span>Total</span><span>€{(totalPrice / 100).toFixed(2)}</span></div>
                        <Button type="submit" form="checkout-form" className="w-full h-12 text-lg active:scale-95 transition-transform" disabled={isLoading}>
                            {isLoading ? "Processing..." : `Pay €${(totalPrice / 100).toFixed(2)}`}
                        </Button>
                        <div className="flex items-center justify-center gap-2 text-xs text-slate-400"><ShieldCheck size={14} /> Secure Encrypted Payment</div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}