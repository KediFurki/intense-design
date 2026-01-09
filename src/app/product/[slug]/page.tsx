import { db } from "@/server/db";
import { products } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import AddToCartButton from "@/components/shop/add-to-cart-button";
import ModelViewer from "@/components/shop/model-viewer";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: { category: true },
  });

  if (!product) notFound();

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* SOL: GÖRSEL & 3D */}
        <div className="space-y-4">
          <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden relative border shadow-sm group">
            {product.modelUrl ? (
              <ModelViewer 
                src={product.modelUrl} 
                poster={product.images?.[0] || ""} 
                alt={`3D model of ${product.name}`} 
              />
            ) : (
              product.images?.[0] ? (
                <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">No Image</div>
              )
            )}
          </div>
          <p className="text-center text-sm text-slate-500">
             {product.modelUrl 
                ? "👆 Touch to rotate. Use AR button on mobile." 
                : "No 3D Model available."}
          </p>
        </div>

        {/* SAĞ: BİLGİLER */}
        <div className="space-y-8">
             <div>
             <Badge variant={product.stock > 0 ? "secondary" : "destructive"} className="mb-4">
                {product.stock > 0 ? "In Stock" : "Out of Stock"}
             </Badge>
             <h1 className="text-4xl font-bold text-slate-900 mb-2">{product.name}</h1>
             <p className="text-2xl font-light text-slate-600">€{(product.price / 100).toFixed(2)}</p>
          </div>
          <div className="prose prose-slate text-slate-600 leading-relaxed">{product.description}</div>
          
           <div className="grid grid-cols-3 gap-4 border-t border-b py-6">
             <div><p className="text-sm font-semibold">Width</p><p className="text-slate-500">{product.width || "-"} mm</p></div>
             <div><p className="text-sm font-semibold">Height</p><p className="text-slate-500">{product.height || "-"} mm</p></div>
             <div><p className="text-sm font-semibold">Depth</p><p className="text-slate-500">{product.depth || "-"} mm</p></div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <AddToCartButton 
              stock={product.stock}
              data={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                image: product.images?.[0] || "",
                categoryName: product.category?.name
              }}
              className="w-full h-14 text-lg"
            />
          </div>
          
           <div className="flex items-center gap-2 text-sm text-green-600">
             <Check size={16} />
             <span>Free shipping on orders over €500</span>
          </div>
        </div>

      </div>
    </div>
  );
}