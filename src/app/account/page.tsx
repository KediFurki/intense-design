import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { orders, users } from "@/server/db/schema"; // addresses kaldırıldı
import { eq, desc } from "drizzle-orm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Package, MapPin, User } from "lucide-react"; // Settings kaldırıldı

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Kullanıcı Verilerini Çek
  const userProfile = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    with: {
        addresses: true,
        orders: {
            orderBy: [desc(orders.createdAt)],
            with: { items: { with: { product: true } } }
        }
    }
  });

  if (!userProfile) return null;

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">My Account</h1>
            <p className="text-slate-500">Manage your profile, orders and addresses.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                {userProfile.name?.charAt(0).toUpperCase()}
            </div>
            <div>
                <p className="font-semibold">{userProfile.name}</p>
                <p className="text-sm text-slate-500">{userProfile.email}</p>
            </div>
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList>
          <TabsTrigger value="orders" className="gap-2"><Package size={16}/> Orders</TabsTrigger>
          <TabsTrigger value="addresses" className="gap-2"><MapPin size={16}/> Addresses</TabsTrigger>
          <TabsTrigger value="profile" className="gap-2"><User size={16}/> Profile</TabsTrigger>
        </TabsList>

        {/* SİPARİŞLER SEKMEİ */}
        <TabsContent value="orders" className="space-y-4">
            {userProfile.orders.length === 0 ? (
                // DÜZELTME: "haven't" -> "haven&apos;t"
                <Card><CardContent className="py-10 text-center text-muted-foreground">You haven&apos;t placed any orders yet.</CardContent></Card>
            ) : (
                userProfile.orders.map((order) => (
                    <Card key={order.id}>
                        <CardHeader className="bg-slate-50/50 border-b py-4">
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className="font-semibold text-sm">Order #{order.id.slice(0, 8)}</p>
                                    <p className="text-xs text-muted-foreground">{order.createdAt?.toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <Badge className="capitalize mb-1">{order.status}</Badge>
                                    <p className="font-bold">€{(order.totalAmount / 100).toFixed(2)}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span>{item.product?.name} <span className="text-slate-400">x{item.quantity}</span></span>
                                    <span>€{((item.price * item.quantity)/100).toFixed(2)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))
            )}
        </TabsContent>

        {/* ADRESLER SEKMEİ */}
        <TabsContent value="addresses">
            <Card>
                <CardHeader>
                    <CardTitle>Saved Addresses</CardTitle>
                    <CardDescription>Manage your shipping and billing addresses.</CardDescription>
                </CardHeader>
                <CardContent>
                    {userProfile.addresses.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No addresses saved.</p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {userProfile.addresses.map((addr) => (
                                <div key={addr.id} className="border p-4 rounded-lg relative">
                                    <h4 className="font-semibold">{addr.title}</h4>
                                    <p className="text-sm text-slate-600 mt-1">{addr.address}</p>
                                    <p className="text-sm text-slate-600">{addr.zipCode} {addr.city} / {addr.country}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    <Button className="mt-4" variant="outline">Add New Address</Button>
                </CardContent>
            </Card>
        </TabsContent>

        {/* PROFİL SEKMEİ */}
        <TabsContent value="profile">
            <Card>
                <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Full Name</Label>
                        <Input defaultValue={userProfile.name || ""} disabled />
                    </div>
                    <div className="grid gap-2">
                        <Label>Email</Label>
                        <Input defaultValue={userProfile.email} disabled />
                    </div>
                    {/* Buraya form action ile güncelleme özelliği eklenebilir */}
                    <Button>Save Changes</Button>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}