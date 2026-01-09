import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Box } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/server/db";
import { products, categories } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";

export default async function AdminProductsPage() {
  // Join sorgusu: Ürünleri ve Kategori isimlerini çek
  const productsList = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      stock: products.stock,
      category: categories.name,
      image: products.images,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your furniture inventory ({productsList.length})
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </Link>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No products found. Add your first furniture.
                </TableCell>
              </TableRow>
            ) : (
              productsList.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
  {product.image && product.image[0] ? (
    <Image
      src={product.image[0]}
      alt={product.name}
      width={40} // Genişlik (px)
      height={40} // Yükseklik (px)
      className="rounded-md object-cover"
    />
  ) : (
    <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center">
      <Box className="h-5 w-5 text-slate-400" />
    </div>
  )}
</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                      {product.category || "Uncategorized"}
                    </span>
                  </TableCell>
                  <TableCell>€{(product.price / 100).toFixed(2)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                    <Link href={`/admin/products/${product.id}`}>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}