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
import { updateSettings } from "@/server/actions/settings";
import { useState } from "react";

interface SettingsFormProps {
  initialData: {
    storeName: string;
    supportEmail: string;
    currency: string;
    maintenanceMode: boolean;
  };
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);

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
        <Button type="submit" disabled={loading} className="bg-slate-900 text-white hover:bg-slate-800">
             {loading ? "Saving..." : <><Save size={16} className="mr-2"/> Save All Changes</>}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
            <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:shadow-none py-3 px-1 font-medium">General</TabsTrigger>
            <TabsTrigger value="payment" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:shadow-none py-3 px-1 font-medium">Payments</TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:shadow-none py-3 px-1 font-medium">Notifications</TabsTrigger>
        </TabsList>
        
        <div className="mt-6 space-y-6">
            <TabsContent value="general" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Store size={18}/> Store Details</CardTitle>
                        <CardDescription>Manage global store configuration.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Store Name</Label>
                                <Input name="storeName" defaultValue={initialData.storeName} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Support Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input name="supportEmail" className="pl-9" defaultValue={initialData.supportEmail} required />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                             <Label>Currency</Label>
                             <Select name="currency" defaultValue={initialData.currency}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
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

                <Card className="border-orange-200 bg-orange-50/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-800"><Lock size={18}/> Access Control</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Maintenance Mode</Label>
                                <div className="text-sm text-muted-foreground">Close store for customers temporarily.</div>
                            </div>
                            <Switch name="maintenanceMode" defaultChecked={initialData.maintenanceMode} />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="payment">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CreditCard size={18}/> Payment Gateways</CardTitle>
                        <CardDescription>Configure how you accept payments.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 border rounded-lg flex items-center justify-between bg-slate-50">
                             <div className="flex items-center gap-3">
                                <div className="h-10 w-14 bg-white border rounded flex items-center justify-center font-bold text-slate-700 italic">Stripe</div>
                                <div>
                                    <div className="font-bold text-sm">Credit Card (Stripe)</div>
                                    <div className="text-xs text-green-600 font-medium">Connected & Active</div>
                                </div>
                             </div>
                             <Button variant="outline" size="sm" type="button" disabled>Manage</Button>
                        </div>
                        <div className="p-4 border rounded-lg flex items-center justify-between opacity-60">
                             <div className="flex items-center gap-3">
                                <div className="h-10 w-14 bg-white border rounded flex items-center justify-center font-bold text-blue-800 italic">PayPal</div>
                                <div>
                                    <div className="font-bold text-sm">PayPal</div>
                                    <div className="text-xs text-slate-500">Currently Disabled</div>
                                </div>
                             </div>
                             <Button variant="outline" size="sm" type="button">Connect</Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="notifications">
                <Card>
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2"><Bell size={18}/> Email Notifications</CardTitle>
                         <CardDescription>Control when you receive emails.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">New Order Alert</Label>
                                <div className="text-sm text-muted-foreground">Receive an email when a customer places an order.</div>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <div className="space-y-0.5">
                                <Label className="text-base">Low Stock Warning</Label>
                                <div className="text-sm text-muted-foreground">Get notified when product stock is below 5.</div>
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