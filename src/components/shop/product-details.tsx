"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Check, Info, Palette, Ruler, Hammer } from "lucide-react";
import AddToCartButton from "@/components/shop/add-to-cart-button";
import ModelViewer from "@/components/shop/model-viewer";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface VariantAttributes {
  color?: string;
  colorCode?: string;
  size?: string;
  material?: string;
}

interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: unknown;
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
    maskImage: string | null;
    width: number | null;
    height: number | null;
    depth: number | null;
    category?: { name: string };
  };
  variants: Variant[];
}

export function ProductDetails({ product, variants }: ProductDetailsProps) {
  const t = useTranslations("Product");
  
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() => {
    if (variants.length > 0) {
      const firstAvailable = variants.find(v => v.stock > 0);
      return firstAvailable ? firstAvailable.id : variants[0].id;
    }
    return null;
  });

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const selectedAttrs = selectedVariant ? (selectedVariant.attributes as VariantAttributes) : null;

  const variantImages = Array.isArray(selectedVariant?.images) 
      ? (selectedVariant?.images as string[]) 
      : [];
      
  const displayImages = variantImages.length > 0 ? variantImages : (product.images || []);
  const mainImage = displayImages[0];

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in duration-500">
      <div className="space-y-4">
        <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden relative border shadow-sm group">
            {product.maskImage && selectedAttrs?.colorCode ? (
                <div className="relative w-full h-full">
                    <Image src={mainImage} alt={product.name} fill className="object-cover z-0" />
                    <div 
                        className="absolute inset-0 z-10 mix-blend-multiply opacity-90 transition-colors duration-300"
                        style={{
                            backgroundColor: selectedAttrs.colorCode,
                            maskImage: `url(${product.maskImage})`,
                            WebkitMaskImage: `url(${product.maskImage})`,
                            maskSize: 'cover',
                            WebkitMaskSize: 'cover',
                            maskRepeat: 'no-repeat',
                            WebkitMaskRepeat: 'no-repeat'
                        }}
                    />
                </div>
            ) : (
                product.modelUrl && !selectedVariant ? (
                    <ModelViewer
                      src={product.modelUrl}
                      poster={mainImage || ""}
                      alt={`3D model of ${product.name}`}
                    />
                ) : (
                    mainImage ? (
                        <Image src={mainImage} alt={product.name} fill className="object-cover transition-all duration-500" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">No Image</div>
                    )
                )
            )}
            
            <div className="absolute top-4 left-4 z-20">
             <Badge variant={currentStock > 0 ? "secondary" : "destructive"} className="shadow-sm">
                {currentStock > 0 ? t('inStock') : t('outOfStock')}
             </Badge>
          </div>
        </div>
        
        {displayImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {displayImages.map((img, i) => (
                    <div key={i} className="w-20 h-20 relative rounded-md overflow-hidden border cursor-pointer shrink-0 hover:opacity-80">
                        <Image src={img} alt="thumbnail" fill className="object-cover" />
                    </div>
                ))}
            </div>
        )}
      </div>

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

        {selectedAttrs && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedAttrs.color && (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border">
                        <Palette size={16} className="text-slate-500"/>
                        <div><p className="text-[10px] uppercase text-slate-500 font-bold">Color</p><p className="text-sm font-medium">{selectedAttrs.color}</p></div>
                    </div>
                )}
                {selectedAttrs.size && (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border">
                        <Ruler size={16} className="text-slate-500"/>
                        <div><p className="text-[10px] uppercase text-slate-500 font-bold">Size</p><p className="text-sm font-medium">{selectedAttrs.size}</p></div>
                    </div>
                )}
                {selectedAttrs.material && (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border">
                        <Hammer size={16} className="text-slate-500"/>
                        <div><p className="text-[10px] uppercase text-slate-500 font-bold">Material</p><p className="text-sm font-medium">{selectedAttrs.material}</p></div>
                    </div>
                )}
            </div>
        )}

        <div className="prose prose-slate text-slate-600 leading-relaxed text-sm">
          {product.description || "No description available."}
        </div>

        {variants.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                {t('options') || "Colors & Options"} 
            </label>
            <div className="flex flex-wrap gap-3">
              {variants.map((variant) => {
                 const attrs = variant.attributes as VariantAttributes;
                 const isSelected = selectedVariantId === variant.id;
                 
                 return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      disabled={variant.stock <= 0}
                      title={`${attrs.color || variant.name} - ${attrs.size || ''}`}
                      className={cn(
                        "relative w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center overflow-hidden",
                        isSelected ? "border-blue-600 ring-2 ring-blue-100 scale-110" : "border-slate-200 hover:border-slate-300",
                        variant.stock <= 0 && "opacity-40 cursor-not-allowed"
                      )}
                      style={{ backgroundColor: attrs.colorCode || "#eee" }}
                    >
                      {!attrs.colorCode && <span className="text-xs font-bold text-slate-400">{variant.name?.charAt(0)}</span>}
                      {isSelected && attrs.colorCode && (<div className="bg-white/20 p-1 rounded-full backdrop-blur-sm"><Check size={14} className="text-white drop-shadow-md" /></div>)}
                    </button>
                 );
              })}
            </div>
            {selectedVariant && (<p className="text-sm text-slate-500">Selected: <span className="font-semibold text-slate-900">{selectedVariant.name}</span></p>)}
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
              image: mainImage || "",
              categoryName: product.category?.name,
            }}
            className="w-full h-14 text-lg shadow-xl shadow-blue-900/5"
          />
          
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Check size={14} className="text-green-600" /><span>{t('freeShipping')}</span><span className="mx-2">•</span><Info size={14} /><span>2 Year Warranty</span>
          </div>
        </div>
      </div>
    </div>
  );
}