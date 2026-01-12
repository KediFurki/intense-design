"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import AddToCartButton from "@/components/shop/add-to-cart-button";
import ModelViewer from "@/components/shop/model-viewer";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string | null;
  attributes: unknown;
}

interface ProductDetailsProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    stock: number;
    images: string[] | null;
    modelUrl: string | null;
    width: number | null;
    height: number | null;
    depth: number | null;
    category?: { name: string };
  };
  variants: Variant[];
}

export function ProductDetails({ product, variants }: ProductDetailsProps) {
  const t = useTranslations("Product");
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const currentImage = selectedVariant?.image || product.images?.[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* SOL: GÖRSEL / 3D MODEL */}
      <div className="space-y-4">
        <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden relative border shadow-sm group">
          {product.modelUrl && !selectedVariant ? (
            <ModelViewer
              src={product.modelUrl}
              poster={currentImage || ""}
              alt={`3D model of ${product.name}`}
            />
          ) : (
            currentImage ? (
              <Image
                src={currentImage}
                alt={product.name}
                fill
                className="object-cover transition-all duration-500"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No Image</div>
            )
          )}
        </div>
      </div>

      {/* SAĞ: DETAYLAR */}
      <div className="space-y-8">
        <div>
          <Badge variant={currentStock > 0 ? "secondary" : "destructive"} className="mb-4">
            {currentStock > 0 ? t('inStock') : t('outOfStock')}
          </Badge>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">{product.name}</h1>
          <div className="flex items-end gap-2">
             <p className="text-3xl font-light text-slate-900">€{(currentPrice / 100).toFixed(2)}</p>
             {selectedVariant && <p className="text-sm text-slate-500 mb-1.5">(Base: €{(product.price/100).toFixed(0)})</p>}
          </div>
        </div>

        <div className="prose prose-slate text-slate-600 leading-relaxed">
          {product.description}
        </div>

        {/* VARYASYON SEÇİCİ */}
        {variants.length > 0 && (
          <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <label className="text-sm font-semibold text-slate-900">Options:</label>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                    selectedVariantId === variant.id
                      ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  )}
                >
                  {variant.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 border-t border-b py-6">
          <div><p className="text-sm font-semibold">{t('width')}</p><p className="text-slate-500">{product.width || "-"} mm</p></div>
          <div><p className="text-sm font-semibold">{t('height')}</p><p className="text-slate-500">{product.height || "-"} mm</p></div>
          <div><p className="text-sm font-semibold">{t('depth')}</p><p className="text-slate-500">{product.depth || "-"} mm</p></div>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <AddToCartButton
            stock={currentStock}
            text={t('addToCart')}
            data={{
              id: product.id,
              variantId: selectedVariant?.id,
              variantName: selectedVariant?.name,
              name: product.name,
              slug: product.slug,
              price: currentPrice,
              image: currentImage || "",
              categoryName: product.category?.name,
            }}
            className="w-full h-14 text-lg"
          />
        </div>
      </div>
    </div>
  );
}