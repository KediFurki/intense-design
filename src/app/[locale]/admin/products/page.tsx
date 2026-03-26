import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Box } from "lucide-react";
import { Link } from "@/lib/i18n/routing";
import Image from "next/image";
import { db } from "@/server/db";
import { products, categories } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";
import { deleteProduct } from "@/server/actions/products";
import { getTranslations, getLocale } from "next-intl/server";

export default async function AdminProductsPage() {
  const t = await getTranslations("Admin");
  const locale = await getLocale(); // Admin panelinin o anki dili

  const productsList = await db
    .select({
      id: products.id,
      name: products.name, // Bu artık JSON
      price: products.price,
      stock: products.stock,
      categoryName: categories.name, // Bu da JSON
      image: products.images,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.createdAt));

  // Helper: JSON'dan doğru dili çekme
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getLocalized = (data: any) => {
    if (!data) return "-";
    if (typeof data === "string") return data;
    return data[locale] || data['en'] || Object.values(data)[0] || "-";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">{t('products')}</h1>
          <p className="text-stone-500">
            {t('manageInventory')} ({productsList.length})
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button className="cursor-pointer bg-stone-900 text-white hover:bg-stone-800 rounded-xl">
            <Plus className="mr-2 h-4 w-4" /> {t('addProduct')}
          </Button>
        </Link>
      </div>

      <div className="border border-stone-200 rounded-2xl bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-stone-50 hover:bg-stone-50">
              <TableHead className="w-[80px] text-stone-600">{t('image')}</TableHead>
              <TableHead className="text-stone-600">{t('name')}</TableHead>
              <TableHead className="text-stone-600">{t('category')}</TableHead>
              <TableHead className="text-stone-600">{t('price')}</TableHead>
              <TableHead className="text-stone-600">{t('stock')}</TableHead>
              <TableHead className="text-right text-stone-600">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-stone-400">
                  {t('noProducts')}
                </TableCell>
              </TableRow>
            ) : (
              productsList.map((product) => (
                <TableRow key={product.id} className="hover:bg-stone-50/50">
                  <TableCell>
                    {product.image && product.image[0] ? (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-stone-200">
                         <Image src={product.image[0]} alt="img" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center">
                        <Box className="h-5 w-5 text-stone-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-stone-900">
                    {getLocalized(product.name)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-stone-100 border border-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                      {getLocalized(product.categoryName) || "Uncategorized"}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-stone-700">€{(product.price / 100).toFixed(2)}</TableCell>
                  <TableCell>
                     <span className={product.stock < 5 ? "text-red-600 font-bold" : "text-emerald-600 font-medium"}>
                        {product.stock}
                     </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/products/${product.id}`}>
                        <Button variant="ghost" size="icon" className="cursor-pointer hover:bg-amber-50 text-amber-700">
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