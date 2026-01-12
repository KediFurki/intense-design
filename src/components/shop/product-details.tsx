"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Check, Info, ZoomIn, ChevronRight, X } from "lucide-react";
import AddToCartButton from "@/components/shop/add-to-cart-button";
import ModelViewer from "@/components/shop/model-viewer";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
// DÜZELTME: DialogClose EKLENDİ
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    longDescription?: string | null;
    price: number;
    stock: number;
    images: string[] | null;
    modelUrl: string | null;
    maskImage: string | null;
    width: number | null;
    height: number | null;
    depth: number | null;
    material: string | null;
    category?: { name: string };
  };
  variants: Variant[];
}

export function ProductDetails({ product, variants }: ProductDetailsProps) {
  const t = useTranslations("Product");
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() => {
    if (variants.length > 0) return variants[0].id;
    return null;
  });

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const selectedAttrs = selectedVariant ? (selectedVariant.attributes as VariantAttributes) : null;
  const variantImages = Array.isArray(selectedVariant?.images) ? (selectedVariant?.images as string[]) : [];
  const displayImages = variantImages.length > 0 ? variantImages : (product.images || []);
  const mainImage = displayImages[0];
  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

  const renderGridVisualizer = () => {
     const sizeStr = selectedAttrs?.size || ""; 
     const cols = sizeStr.includes("200") ? 4 : sizeStr.includes("150") ? 3 : 2;
     const rows = sizeStr.includes("180") ? 3 : sizeStr.includes("100") ? 2 : 2;
     
     return (
        <div className="w-full h-full flex items-center justify-center p-8 bg-slate-50">
            <div className="grid gap-1 transition-all duration-500" 
                 style={{ 
                     gridTemplateColumns: `repeat(${cols}, 1fr)`,
                     width: `${cols * 60}px`,
                     height: `${rows * 60}px`
                 }}>
                {Array.from({ length: cols * rows }).map((_, i) => (
                    <div key={i} className="border-2 border-white rounded shadow-sm transition-colors duration-300"
                         style={{ backgroundColor: selectedAttrs?.colorCode || "#ddd" }}
                    />
                ))}
            </div>
        </div>
     );
  };

  const renderProductImage = (isZoomed = false) => {
    if (product.maskImage && selectedAttrs?.colorCode) {
        return (
            <div className={cn("relative w-full h-full", isZoomed ? "min-h-[80vh]" : "")}>
                <Image src={mainImage} alt={product.name} fill className="object-contain z-0" priority />
                <div className="absolute inset-0 z-10 mix-blend-multiply opacity-90 transition-colors duration-300"
                    style={{ backgroundColor: selectedAttrs.colorCode, maskImage: `url(${product.maskImage})`, WebkitMaskImage: `url(${product.maskImage})`, maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} />
            </div>
        );
    }
    if (!mainImage && selectedAttrs?.size) {
        return renderGridVisualizer();
    }
    if (product.modelUrl && !selectedVariant && !isZoomed) {
        return <ModelViewer src={product.modelUrl} poster={mainImage || ""} alt={`3D model of ${product.name}`} />;
    }
    if (mainImage) {
        return <div className={cn("relative w-full h-full", isZoomed ? "min-h-[80vh]" : "")}><Image src={mainImage} alt={product.name} fill className="object-contain transition-all duration-500" priority /></div>;
    }
    return <div className="flex items-center justify-center h-full text-slate-400">No Image</div>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-700">
      
      <div className="lg:col-span-8 lg:h-[calc(100vh-8rem)] lg:sticky lg:top-24 flex flex-col gap-4">
         <div className="flex-1 bg-[#F5F5F7] rounded-3xl overflow-hidden relative group cursor-zoom-in border border-slate-100 shadow-sm">
             <Dialog>
                <DialogTrigger asChild>
                    <div className="w-full h-full p-8 md:p-16 flex items-center justify-center">
                        {renderProductImage()}
                        <div className="absolute bottom-6 right-6 bg-white/90 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <ZoomIn size={24} className="text-slate-800"/>
                        </div>
                    </div>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 overflow-hidden bg-white border-none flex items-center justify-center shadow-2xl focus:outline-none">
                    <DialogTitle className="sr-only">Zoom View</DialogTitle>
                    
                    <div className="relative w-full h-full p-4">
                        {renderProductImage(true)}
                        
                        {/* DÜZELTME: DialogClose kullanıldı ve z-index artırıldı */}
                        <DialogClose className="absolute top-6 right-6 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors cursor-pointer z-50">
                           <X size={24} className="text-slate-800" />
                        </DialogClose>
                    </div>
                </DialogContent>
             </Dialog>
             <div className="absolute top-6 left-6 z-20"><Badge variant={currentStock > 0 ? "secondary" : "destructive"} className="px-3 py-1 shadow-md bg-white/90 backdrop-blur">{currentStock > 0 ? t('inStock') : t('outOfStock')}</Badge></div>
         </div>
         {displayImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1">
                {displayImages.map((img, i) => (
                    <div key={i} className="w-24 h-24 relative rounded-xl overflow-hidden border-2 border-transparent hover:border-slate-900 cursor-pointer shrink-0 bg-[#F5F5F7] transition-all">
                        <Image src={img} alt="thumbnail" fill className="object-contain p-2" />
                    </div>
                ))}
            </div>
         )}
      </div>

      <div className="lg:col-span-4 space-y-8 py-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2"><span>{product.category?.name || "Collection"}</span><ChevronRight size={14}/><span>{product.name}</span></div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">{product.name}</h1>
          <p className="text-3xl font-medium text-slate-900">€{(currentPrice / 100).toFixed(2)}</p>
          <p className="text-sm text-slate-500 mt-2">Customizable modular system.</p>
        </div>

        {variants.length > 0 && (
          <div className="space-y-6 pt-6 border-t border-slate-100">
            <div className="space-y-3">
                <div className="flex justify-between"><label className="text-sm font-bold text-slate-900">Finish</label><span className="text-xs text-slate-500">{selectedAttrs?.color}</span></div>
                <div className="flex flex-wrap gap-3">
                {variants.map((v) => {
                    const attrs = v.attributes as VariantAttributes;
                    return (
                        <button key={v.id} onClick={() => setSelectedVariantId(v.id)} className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all", selectedVariantId === v.id ? "ring-2 ring-offset-2 ring-slate-900 scale-110" : "border hover:scale-105")} style={{ backgroundColor: attrs.colorCode || "#eee" }}>
                            {selectedVariantId === v.id && attrs.colorCode && <Check size={12} className="text-white drop-shadow-md"/>}
                        </button>
                    );
                })}
                </div>
            </div>
            
            <div className="space-y-3">
                 <label className="text-sm font-bold text-slate-900">Configuration</label>
                 <div className="grid grid-cols-2 gap-2">
                    {variants.map((v) => {
                        const attrs = v.attributes as VariantAttributes;
                        if (attrs.color !== selectedAttrs?.color) return null;
                        
                        return (
                            <button key={v.id} onClick={() => setSelectedVariantId(v.id)} 
                                className={cn("p-3 rounded-xl border text-left transition-all", selectedVariantId === v.id ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-400")}>
                                <div className="text-xs font-bold text-slate-900">{attrs.size || "Standard"}</div>
                                <div className="text-xs text-slate-500">€{(v.price/100).toFixed(0)}</div>
                            </button>
                        )
                    })}
                 </div>
            </div>
          </div>
        )}

        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Dimensions</span><span className="font-medium">{selectedAttrs?.size || "-"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Material</span><span className="font-medium">{selectedAttrs?.material || "Premium"}</span></div>
        </div>

        <AddToCartButton stock={currentStock} text={t('addToCart')}
            data={{ 
                id: product.id, 
                variantId: selectedVariant?.id, 
                variantName: selectedVariant?.name || "Standard", 
                name: product.name, 
                slug: product.slug, 
                price: currentPrice, 
                image: mainImage || "", 
                categoryName: product.category?.name 
            }}
            className="w-full h-14 text-lg bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xl"
        />

        <Tabs defaultValue="desc" className="w-full pt-4">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl">
                <TabsTrigger value="desc" className="rounded-lg">About</TabsTrigger>
                <TabsTrigger value="delivery" className="rounded-lg">Shipping</TabsTrigger>
            </TabsList>
            <TabsContent value="desc" className="mt-4 prose prose-sm text-slate-600">{product.longDescription || product.description}</TabsContent>
            <TabsContent value="delivery" className="mt-4 text-sm text-slate-600"><p>Free delivery on all orders. Ships in 2-3 weeks.</p></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}