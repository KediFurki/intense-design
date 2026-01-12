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
import { Link } from "@/i18n/routing"; // DÜZELTME: i18n uyumlu Link
import Image from "next/image";
import { db } from "@/server/db";
import { products, categories } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";
import { deleteProduct } from "@/server/actions/products";
import { getTranslations } from "next-intl/server"; // DÜZELTME: Çeviri

export default async function AdminProductsPage() {
  const t = await getTranslations("Admin"); // Çevirileri yükle

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
          <h1 className="text-3xl font-bold tracking-tight">{t('products')}</h1>
          <p className="text-muted-foreground">
            {t('manageInventory')} ({productsList.length})
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" /> {t('addProduct')}
          </Button>
        </Link>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">{t('image')}</TableHead>
              <TableHead>{t('name')}</TableHead>
              <TableHead>{t('category')}</TableHead>
              <TableHead>{t('price')}</TableHead>
              <TableHead>{t('stock')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {t('noProducts')}
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
                        width={40}
                        height={40}
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
                        <Button variant="ghost" size="icon" className="cursor-pointer hover:bg-slate-100">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      
                      <form action={async () => {
                        "use server";
                        await deleteProduct(product.id);
                      }}>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 cursor-pointer hover:bg-red-50" type="submit">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
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