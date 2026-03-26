import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { desc } from "drizzle-orm";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function AdminCustomersPage() {
  const customerList = await db.select().from(users).orderBy(desc(users.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Customers</h1>
          <p className="text-stone-500">{customerList.length} registered user{customerList.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <Card className="border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="bg-stone-50/40 border-b border-stone-200"><CardTitle className="text-stone-900">Registered Users</CardTitle></CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow className="bg-stone-50 hover:bg-stone-50">
                        <TableHead className="w-[80px] text-stone-600">Avatar</TableHead>
                        <TableHead className="text-stone-600">Name</TableHead>
                        <TableHead className="text-stone-600">Email</TableHead>
                        <TableHead className="text-stone-600">Role</TableHead>
                        <TableHead className="text-right text-stone-600">Joined</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customerList.map((user) => (
                        <TableRow key={user.id} className="hover:bg-stone-50/50">
                            <TableCell>
                                <Avatar className="border border-stone-200">
                                    <AvatarImage src={user.image || ""} />
                                    <AvatarFallback className="bg-stone-100 text-stone-600">{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </TableCell>
                            <TableCell className="font-medium text-stone-900">{user.name}</TableCell>
                            <TableCell className="text-stone-600">{user.email}</TableCell>
                            <TableCell>
                              <span className="capitalize inline-flex items-center rounded-full bg-stone-100 border border-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                                {user.role}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-stone-500">{user.createdAt?.toLocaleDateString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}