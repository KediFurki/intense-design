"use client";

import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Truck, ShieldCheck, FileText, Building2, User } from "lucide-react";
import { Link as I18nLink } from "@/i18n/routing";
import Image from "next/image";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { createOrder } from "@/server/actions/order";
import { AddressSelector } from "@/components/checkout/address-selector";
import { useTranslations } from "next-intl";

export default function CheckoutPage() {
  const t = useTranslations("Checkout");
  const cart = useCart();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [invoiceType, setInvoiceType] = useState<"individual" | "corporate">("individual");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  if (cart.items.length === 0) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">{t('emptyCart')}</h2>
            <I18nLink href="/"><Button>{t('goShopping')}</Button></I18nLink>
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
      
      invoiceType: invoiceType,
      taxId: invoiceType === 'corporate' ? formData.get("taxId") as string : undefined,
      companyName: invoiceType === 'corporate' ? formData.get("companyName") as string : undefined,
      taxOffice: invoiceType === 'corporate' ? formData.get("taxOffice") as string : undefined,
      
      // ÖNEMLİ DÜZELTME: Varyasyon bilgileri siparişe ekleniyor
      items: cart.items.map(item => ({ 
          id: item.id, 
          variantId: item.variantId,
          variantName: item.variantName, // <-- Bu alan sipariş detayında varyasyonu gösterir
          price: item.price, 
          quantity: item.quantity 
      }))
    };

    const result = await createOrder(orderData);

    if (result.success) {
        cart.removeAll();
        toast.success("Order placed successfully! 🇪🇺");
        router.push("/admin/orders");
    } else {
        toast.error(result.error || "Something went wrong.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <I18nLink href="/" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-8 transition-colors"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop</I18nLink>

        <div className="grid lg:grid-cols-5 gap-12">
            {/* SOL: FORM */}
            <div className="lg:col-span-3 space-y-8">
                
                {/* 1. Kargo Bilgileri */}
                <Card className="border-none shadow-md">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-blue-600" /> {t('title')}</CardTitle></CardHeader>
                    <CardContent>
                        <form id="checkout-form" onSubmit={onSubmit} className="grid gap-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>{t('firstName')}</Label><Input name="firstName" placeholder="Jane" required /></div>
                                <div className="space-y-2"><Label>{t('lastName')}</Label><Input name="lastName" placeholder="Doe" required /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>{t('email')}</Label><Input name="email" type="email" placeholder="jane@example.eu" required /></div>
                                <div className="space-y-2"><Label>{t('phone')}</Label><Input name="phone" type="tel" placeholder="+359..." required /></div>
                            </div>
                            
                            {/* AKILLI ADRES SEÇİCİ */}
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <AddressSelector />
                            </div>

                            {/* Manuel Adres Detayı */}
                            <div className="space-y-2"><Label>{t('address')}</Label><Input name="address" placeholder="Street, Building, Apt..." required /></div>
                            <div className="space-y-2"><Label>{t('zipCode')}</Label><Input name="zipCode" placeholder="1000" required /></div>

                            <Separator />

                            {/* 2. Fatura Bilgileri */}
                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-blue-600" /> {t('billingDetails')}</h3>
                                <div className="flex gap-4">
                                    <div 
                                      className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all flex items-center gap-3 ${invoiceType === 'individual' ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'}`} 
                                      onClick={() => setInvoiceType('individual')}
                                    >
                                        <div className={`p-2 rounded-full ${invoiceType === 'individual' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}><User size={18}/></div>
                                        <div><div className="font-medium text-sm">{t('personal')}</div><div className="text-xs text-slate-500">{t('personalDesc')}</div></div>
                                    </div>
                                    <div 
                                      className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all flex items-center gap-3 ${invoiceType === 'corporate' ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'}`} 
                                      onClick={() => setInvoiceType('corporate')}
                                    >
                                        <div className={`p-2 rounded-full ${invoiceType === 'corporate' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}><Building2 size={18}/></div>
                                        <div><div className="font-medium text-sm">{t('business')}</div><div className="text-xs text-slate-500">{t('businessDesc')}</div></div>
                                    </div>
                                </div>

                                {invoiceType === "corporate" && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 pt-2">
                                        <div className="space-y-2"><Label>{t('companyName')}</Label><Input name="companyName" placeholder="Tech Solutions Ltd." required /></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2"><Label>{t('vatNumber')}</Label><Input name="taxId" placeholder="BG123456789" required /></div>
                                            <div className="space-y-2"><Label>{t('taxOffice')}</Label><Input name="taxOffice" placeholder="Optional" /></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* 3. Ödeme */}
                <Card className="border-none shadow-md">
                    <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-blue-600" /> {t('payment')}</CardTitle></CardHeader>
                    <CardContent>
                        <div className="p-4 border rounded-lg bg-slate-50 flex items-center justify-between cursor-pointer border-blue-200 ring-1 ring-blue-200">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full" /></div>
                                <span className="font-medium text-slate-900">{t('creditCard')}</span>
                            </div>
                            <CreditCard className="text-slate-400" size={20}/>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* SAĞ: ÖZET */}
            <div className="lg:col-span-2">
                <Card className="border-none shadow-md sticky top-24">
                    <CardHeader><CardTitle>{t('orderSummary')}</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            {cart.items.map((item) => (
                                <div key={`${item.id}-${item.variantId || 'base'}`} className="flex gap-4">
                                    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-slate-100 shrink-0">
                                        {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                                        {item.variantName && (
                                            <p className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                                                {item.variantName}
                                            </p>
                                        )}
                                        <p className="text-xs text-slate-500 mt-0.5">Qty: {item.quantity}</p>
                                    </div>
                                    <div className="font-medium text-sm">€{((item.price * item.quantity) / 100).toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                        <Separator />
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">{t('subtotal')}</span><span>€{(totalPrice / 100).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">{t('vat')} (20%)</span><span>€{((totalPrice * 0.20) / 100).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">{t('shipping')}</span><span className="text-green-600 font-medium">Free</span></div>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center font-bold text-lg">
                            <span>{t('total')}</span>
                            <span>€{(totalPrice / 100).toFixed(2)}</span> 
                        </div>
                        <Button type="submit" form="checkout-form" className="w-full h-12 text-lg" disabled={isLoading}>
                            {isLoading ? t('processing') : `${t('pay')} €${(totalPrice / 100).toFixed(2)}`}
                        </Button>
                        <div className="flex items-center justify-center gap-2 text-xs text-slate-400"><ShieldCheck size={14} /> Secure Payment</div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}