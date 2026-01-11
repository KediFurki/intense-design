import { db } from "@/server/db";
import { categories } from "@/server/db/schema";
import { desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCategory, deleteCategory } from "@/server/actions/category";
import { Trash2, Plus } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function AdminCategoriesPage() {
  const categoryList = await db.select().from(categories).orderBy(desc(categories.createdAt));

  return (
    <div className="grid gap-8 md:grid-cols-3">
      {/* SOL: YENİ KATEGORİ FORMU */}
      <Card className="md:col-span-1 h-fit">
        <CardHeader><CardTitle>Add New Category</CardTitle></CardHeader>
        <CardContent>
          <form action={async (formData) => {
            "use server";
            await createCategory(formData);
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Living Room" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input id="slug" name="slug" placeholder="living-room" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Optional description..." />
            </div>
            <Button type="submit" className="w-full gap-2"><Plus size={16}/> Create</Button>
          </form>
        </CardContent>
      </Card>

      {/* SAĞ: KATEGORİ LİSTESİ */}
      <Card className="md:col-span-2">
        <CardHeader><CardTitle>Existing Categories</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryList.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No categories yet.</TableCell></TableRow>
              ) : (
                categoryList.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                    <TableCell className="text-right">
                      <form action={async () => {
                        "use server";
                        await deleteCategory(cat.id);
                      }}>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 size={16} />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}