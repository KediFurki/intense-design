"use client";

import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Building2, Truck } from "lucide-react";
import { Link as I18nLink } from "@/lib/i18n/routing";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/lib/i18n/routing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PaymentChoice = "stripe_full" | "stripe_deposit" | "iban" | "cash_on_installation";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Checkout failed.";
}

export default function CheckoutPage() {
  const { items, removeAll } = useCart();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("stripe_full");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "Bulgaria",
    state: "",
    city: "",
    address: "",
    zipCode: "",
    invoiceType: "individual",
    companyName: "",
    taxId: "",
    taxOffice: "",
  });

  const totalPrice = items.reduce((acc, it) => acc + it.price * it.quantity, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Cart is empty.");
      return;
    }

    setIsLoading(true);
    try {
      const customer = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        country: form.country,
        state: form.state,
        city: form.city,
        address: form.address,
        zipCode: form.zipCode,
        invoiceType: (form.invoiceType as "individual" | "corporate") ?? "individual",
        companyName: form.companyName || null,
        taxId: form.taxId || null,
        taxOffice: form.taxOffice || null,
      };

      const payloadItems = items.map((it) => ({
        id: it.id,
        variantId: it.variantId,
        variantName: it.variantName,
        price: it.price,
        quantity: it.quantity,
      }));

      if (paymentChoice === "stripe_full" || paymentChoice === "stripe_deposit") {
        const res = await fetch("/api/stripe/checkout-session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            customer,
            items: payloadItems,
            paymentType: paymentChoice === "stripe_deposit" ? "deposit" : "full",
          }),
        });

        const data: { url?: string; error?: string } = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to create checkout session.");
        if (!data.url) throw new Error("Stripe session URL missing.");

        window.location.href = data.url;
        return;
      }

      const res = await fetch("/api/checkout/offline", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer,
          items: payloadItems,
          paymentMethod: paymentChoice === "iban" ? "iban" : "cash_on_installation",
        }),
      });

      const data: { orderId?: string; error?: string } = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create offline order.");
      if (!data.orderId) throw new Error("Order ID missing.");

      removeAll();
      router.push(`/checkout/pending?oid=${data.orderId}`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <I18nLink href="/cart" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft size={16} /> Back to Cart
          </I18nLink>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Checkout</CardTitle>
              </CardHeader>
              <CardContent>
                <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>First Name</Label>
                      <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                    </div>
                    <div>
                      <Label>Country</Label>
                      <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                    </div>
                    <div>
                      <Label>City</Label>
                      <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                    </div>
                    <div>
                      <Label>Zip Code</Label>
                      <Input value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} required />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Address</Label>
                      <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentChoice} onValueChange={(v) => setPaymentChoice(v as PaymentChoice)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stripe_full">Card / Apple Pay / Google Pay (Full)</SelectItem>
                        <SelectItem value="stripe_deposit">Card / Apple Pay / Google Pay (Deposit 30%)</SelectItem>
                        <SelectItem value="iban">IBAN Bank Transfer (Pay within 3 days)</SelectItem>
                        <SelectItem value="cash_on_installation">Pay at installation (Remaining due)</SelectItem>
                      </SelectContent>
                    </Select>

                    {paymentChoice === "iban" && (
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <Building2 size={14} />
                        IBAN payment must be completed within <b>3 days</b> to keep the reservation.
                      </p>
                    )}

                    {paymentChoice === "cash_on_installation" && (
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <Truck size={14} />
                        You will pay the remaining amount at installation (link / IBAN / cash).
                      </p>
                    )}

                    {(paymentChoice === "stripe_full" || paymentChoice === "stripe_deposit") && (
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <CreditCard size={14} />
                        Secure payment via Stripe.
                      </p>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((it) => (
                  <div key={`${it.id}:${it.variantId || "base"}`} className="flex gap-3">
                    <div className="relative w-16 h-16 bg-white rounded border overflow-hidden">
                      {it.image ? <Image src={it.image} alt={it.name} fill className="object-cover" /> : null}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{it.name}</div>
                      {it.variantName ? <div className="text-xs text-slate-500">{it.variantName}</div> : null}
                      <div className="text-sm text-slate-600">Qty: {it.quantity}</div>
                    </div>
                    <div className="font-medium">€{((it.price * it.quantity) / 100).toFixed(2)}</div>
                  </div>
                ))}

                <Separator />

                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>€{(totalPrice / 100).toFixed(2)}</span>
                </div>

                <Button type="submit" form="checkout-form" className="w-full h-12 text-lg" disabled={isLoading}>
                  {isLoading ? "Processing..." : "Continue"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}