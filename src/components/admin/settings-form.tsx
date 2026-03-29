"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, Mail, CreditCard, Bell, Save, Globe, Lock } from "lucide-react";
import { toast } from "sonner";
import { updateSettings, updateMaintenanceMode } from "@/server/actions/settings";
import { useState, useTransition } from "react";

interface SettingsFormProps {
  initialData: {
    storeName: string;
    supportEmail: string;
    currency: string;
    maintenanceMode: boolean;
    stripeEnabled: boolean;
  };
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [stripeOn, setStripeOn] = useState(initialData.stripeEnabled);
  const [maintenanceOn, setMaintenanceOn] = useState(initialData.maintenanceMode);
  const [maintenancePending, startMaintenanceTransition] = useTransition();

  const handleMaintenanceToggle = (checked: boolean) => {
    setMaintenanceOn(checked);
    startMaintenanceTransition(async () => {
      const res = await updateMaintenanceMode(checked);
      if (res.success) {
        toast.success(checked ? "Maintenance mode enabled" : "Maintenance mode disabled");
      } else {
        setMaintenanceOn(!checked);
        toast.error("Failed to update maintenance mode");
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateSettings(formData);
    if (res.success) toast.success("Settings saved successfully!");
    else toast.error("Failed to save settings.");
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      <div className="flex items-center justify-end">
        <Button type="submit" disabled={loading} className="bg-stone-900 text-white hover:bg-stone-800 rounded-xl cursor-pointer">
             {loading ? "Saving..." : <><Save size={16} className="mr-2"/> Save All Changes</>}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full justify-start border-b border-stone-200 rounded-none h-auto p-0 bg-transparent gap-6">
            <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-700 data-[state=active]:text-amber-800 data-[state=active]:shadow-none py-3 px-1 font-medium text-stone-500 hover:text-stone-700 cursor-pointer">General</TabsTrigger>
            <TabsTrigger value="payment" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-700 data-[state=active]:text-amber-800 data-[state=active]:shadow-none py-3 px-1 font-medium text-stone-500 hover:text-stone-700 cursor-pointer">Payments</TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-700 data-[state=active]:text-amber-800 data-[state=active]:shadow-none py-3 px-1 font-medium text-stone-500 hover:text-stone-700 cursor-pointer">Notifications</TabsTrigger>
        </TabsList>
        
        <div className="mt-6 space-y-6">
            <TabsContent value="general" className="space-y-6">
                <Card className="border-stone-200 rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-stone-900"><Store size={18} className="text-amber-700"/> Store Details</CardTitle>
                        <CardDescription className="text-stone-500">Manage global store configuration.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-stone-700">Store Name</Label>
                                <Input name="storeName" defaultValue={initialData.storeName} required className="border-stone-300 focus-visible:ring-amber-600" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-stone-700">Support Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-stone-400" />
                                    <Input name="supportEmail" className="pl-9 border-stone-300 focus-visible:ring-amber-600" defaultValue={initialData.supportEmail} required />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                             <Label className="text-stone-700">Currency</Label>
                             <Select name="currency" defaultValue={initialData.currency}>
                                <SelectTrigger className="border-stone-300"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EUR">€ Euro (EUR)</SelectItem>
                                    <SelectItem value="USD">$ US Dollar (USD)</SelectItem>
                                    <SelectItem value="TRY">₺ Turkish Lira (TRY)</SelectItem>
                                    <SelectItem value="BGN">лв Bulgarian Lev (BGN)</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50/30 rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-800"><Lock size={18}/> Access Control</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base text-stone-800">Maintenance Mode</Label>
                                <div className="text-sm text-stone-500">Close store for customers temporarily.</div>
                            </div>
                            <Switch
                              name="maintenanceMode"
                              checked={maintenanceOn}
                              disabled={maintenancePending}
                              onCheckedChange={handleMaintenanceToggle}
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="payment" className="space-y-6">
                <Card className="border-stone-200 rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-stone-900"><CreditCard size={18} className="text-amber-700"/> Payment Gateways</CardTitle>
                        <CardDescription className="text-stone-500">Configure how you accept payments.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className={`p-4 border rounded-xl flex items-center justify-between transition-all duration-300 ${
                          stripeOn
                            ? "border-emerald-200 bg-emerald-50/30"
                            : "border-orange-200 bg-orange-50/30"
                        }`}>
                             <div className="flex items-center gap-3">
                                <div className="h-10 w-14 bg-white border border-stone-200 rounded-lg flex items-center justify-center font-bold text-stone-700 italic">Stripe</div>
                                <div>
                                    <div className="font-bold text-sm text-stone-900">Credit Card (Stripe)</div>
                                    <div className={`text-xs font-medium transition-colors duration-300 ${stripeOn ? "text-emerald-600" : "text-orange-600"}`}>
                                      {stripeOn ? "✓ Active" : "Disabled — Order Request Mode"}
                                    </div>
                                </div>
                             </div>
                             <Switch name="stripeEnabled" checked={stripeOn} onCheckedChange={setStripeOn} />
                        </div>
                    </CardContent>
                </Card>

                <Card className={`rounded-2xl shadow-sm border transition-all duration-300 ${
                  stripeOn
                    ? "border-stone-200"
                    : "border-orange-200 bg-orange-50/30"
                }`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-stone-900">
                          <Store size={18} className="text-amber-700"/>
                          Order Request Mode
                        </CardTitle>
                        <CardDescription className="text-stone-500">
                          When Stripe is disabled, customers can still browse and add items to cart,
                          but checkout becomes an &quot;Order Request&quot; — no online payment is processed.
                          You&apos;ll receive the request and can arrange payment manually.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-600 transition-all duration-300">
                          <Lock size={16} className="shrink-0 text-stone-400" />
                          <span>
                            {stripeOn
                              ? "Stripe is active. Customers can pay online via card, Apple Pay, or Google Pay."
                              : "Stripe is off. Customers will submit order requests instead of paying online. IBAN and installation payment options are still available."}
                          </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-stone-200 rounded-2xl shadow-sm opacity-60">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="h-10 w-14 bg-white border border-stone-200 rounded-lg flex items-center justify-center font-bold text-blue-800 italic">PayPal</div>
                                <div>
                                    <div className="font-bold text-sm text-stone-900">PayPal</div>
                                    <div className="text-xs text-stone-400">Coming Soon</div>
                                </div>
                             </div>
                             <Button variant="outline" size="sm" type="button" disabled className="border-stone-300 cursor-pointer">Connect</Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="notifications">
                <Card className="border-stone-200 rounded-2xl shadow-sm">
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2 text-stone-900"><Bell size={18} className="text-amber-700"/> Email Notifications</CardTitle>
                         <CardDescription className="text-stone-500">Control when you receive emails.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                            <div className="space-y-0.5">
                                <Label className="text-base text-stone-800">New Order Alert</Label>
                                <div className="text-sm text-stone-500">Receive an email when a customer places an order.</div>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <div className="space-y-0.5">
                                <Label className="text-base text-stone-800">Low Stock Warning</Label>
                                <div className="text-sm text-stone-500">Get notified when product stock is below 5.</div>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </div>
      </Tabs>
    </form>
  );
}