"use client";

import { useState } from "react"; // useEffect silindi, gerek kalmadı
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Check, Palette, Ruler, Hammer, Info } from "lucide-react";
import AddToCartButton from "@/components/shop/add-to-cart-button";
import ModelViewer from "@/components/shop/model-viewer";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

// Veritabanındaki JSON yapısını tanımlıyoruz
interface VariantAttributes {
  color?: string;
  size?: string;
  material?: string;
}

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
    description: string | null;
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
  
  // DÜZELTME: useEffect yerine başlangıç değerini burada hesaplıyoruz.
  // Bu yöntem çok daha performanslıdır ve hatayı çözer.
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() => {
    if (variants.length > 0) {
      // Stokta olan ilk ürünü bul, yoksa ilk ürünü seç
      const firstAvailable = variants.find(v => v.stock > 0);
      return firstAvailable ? firstAvailable.id : variants[0].id;
    }
    return null;
  });

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);

  // Attributes verisini güvenli şekilde al
  const selectedAttrs = selectedVariant ? (selectedVariant.attributes as VariantAttributes) : null;

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const currentImage = selectedVariant?.image || product.images?.[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in duration-500">
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
                className="object-cover transition-all duration-500 hover:scale-105"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No Image</div>
            )
          )}
          
          {/* Stok Durumu Rozeti */}
          <div className="absolute top-4 left-4">
             <Badge variant={currentStock > 0 ? "secondary" : "destructive"} className="shadow-sm">
                {currentStock > 0 ? t('inStock') : t('outOfStock')}
             </Badge>
          </div>
        </div>
        
      </div>

      {/* SAĞ: DETAYLAR */}
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">{product.name}</h1>
          <div className="flex items-end gap-3 flex-wrap">
             <p className="text-3xl font-light text-slate-900">€{(currentPrice / 100).toFixed(2)}</p>
             {selectedVariant && (
                <span className="text-sm text-slate-500 mb-1.5 line-through">
                    €{((product.price * 1.2) / 100).toFixed(0)}
                </span>
             )}
          </div>
        </div>
        
        {/* SEÇİLİ VARYASYON ÖZELLİKLERİ */}
        {selectedAttrs && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedAttrs.color && (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border">
                        <Palette size={16} className="text-slate-500"/>
                        <div>
                            <p className="text-[10px] uppercase text-slate-500 font-bold">Color</p>
                            <p className="text-sm font-medium">{selectedAttrs.color}</p>
                        </div>
                    </div>
                )}
                {selectedAttrs.size && (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border">
                        <Ruler size={16} className="text-slate-500"/>
                        <div>
                            <p className="text-[10px] uppercase text-slate-500 font-bold">Size</p>
                            <p className="text-sm font-medium">{selectedAttrs.size}</p>
                        </div>
                    </div>
                )}
                {selectedAttrs.material && (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border">
                        <Hammer size={16} className="text-slate-500"/>
                        <div>
                            <p className="text-[10px] uppercase text-slate-500 font-bold">Material</p>
                            <p className="text-sm font-medium">{selectedAttrs.material}</p>
                        </div>
                    </div>
                )}
            </div>
        )}

        <div className="prose prose-slate text-slate-600 leading-relaxed text-sm">
          {product.description || "No description available."}
        </div>

        {/* VARYASYON SEÇİCİ */}
        {variants.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                {t('options') || "Available Options"} 
                <span className="text-xs font-normal text-slate-500">({variants.length})</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => {
                 return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      disabled={variant.stock <= 0}
                      className={cn(
                        "group relative px-4 py-2 rounded-lg text-sm font-medium border transition-all flex flex-col items-center gap-1 min-w-[80px]",
                        selectedVariantId === variant.id
                          ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                        variant.stock <= 0 && "opacity-50 cursor-not-allowed bg-slate-50"
                      )}
                    >
                      <span>{variant.name}</span>
                      {variant.stock <= 0 && <span className="text-[10px] text-red-500 font-bold">Sold Out</span>}
                    </button>
                 );
              })}
            </div>
          </div>
        )}

        {/* BOYUTLAR TABLOSU */}
        {(product.width || product.height || product.depth) && (
             <div className="grid grid-cols-3 gap-4 border-t border-b py-6 text-center">
               <div><p className="text-xs uppercase font-bold text-slate-400 mb-1">{t('width')}</p><p className="font-medium text-slate-900">{product.width || "-"} mm</p></div>
               <div><p className="text-xs uppercase font-bold text-slate-400 mb-1">{t('height')}</p><p className="font-medium text-slate-900">{product.height || "-"} mm</p></div>
               <div><p className="text-xs uppercase font-bold text-slate-400 mb-1">{t('depth')}</p><p className="font-medium text-slate-900">{product.depth || "-"} mm</p></div>
             </div>
        )}

        <div className="flex flex-col gap-4 pt-4">
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
            className="w-full h-14 text-lg shadow-xl shadow-blue-900/5"
          />
          
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Check size={14} className="text-green-600" />
            <span>{t('freeShipping')}</span>
            <span className="mx-2">•</span>
            <Info size={14} />
            <span>2 Year Warranty</span>
          </div>
        </div>
      </div>
    </div>
  );
}