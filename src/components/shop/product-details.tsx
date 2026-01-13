"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Check, ZoomIn, ChevronRight, X } from "lucide-react";
import AddToCartButton from "@/components/shop/add-to-cart-button";
import ModelViewer from "@/components/shop/model-viewer";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";
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
  name: unknown; // Düzeltme: any -> unknown
  price: number;
  stock: number;
  images: unknown;
  attributes: unknown; 
}

interface ProductDetailsProps {
  product: {
    id: string;
    name: unknown; // Düzeltme: any -> unknown
    slug: string;
    description: unknown; // Düzeltme: any -> unknown
    longDescription?: unknown; // Düzeltme: any -> unknown
    price: number;
    stock: number;
    images: string[] | null;
    modelUrl: string | null;
    maskImage: string | null;
    width: number | null;
    height: number | null;
    depth: number | null;
    material: string | null;
    category?: { name: unknown }; // Düzeltme: any -> unknown
  };
  variants: Variant[];
}

export function ProductDetails({ product, variants }: ProductDetailsProps) {
  const t = useTranslations("Product");
  const locale = useLocale();

  // Helper: Type-safe localization
  const getLocalized = (data: unknown): string => {
    if (!data) return "";
    if (typeof data === "string") return data;
    
    // Güvenli tip dönüşümü
    const obj = data as Record<string, string>;
    return obj[locale] || obj["en"] || Object.values(obj)[0] || "";
  };

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() => {
    if (variants.length > 0) return variants[0].id;
    return null;
  });

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const selectedAttrs = selectedVariant ? (selectedVariant.attributes as VariantAttributes) : null;
  
  const variantImagesRaw = selectedVariant?.images;
  const variantImages = Array.isArray(variantImagesRaw) ? (variantImagesRaw as string[]) : [];
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
                <Image src={mainImage} alt={getLocalized(product.name)} fill className="object-contain z-0" priority />
                <div className="absolute inset-0 z-10 mix-blend-multiply opacity-90 transition-colors duration-300"
                    style={{ backgroundColor: selectedAttrs.colorCode, maskImage: `url(${product.maskImage})`, WebkitMaskImage: `url(${product.maskImage})`, maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} />
            </div>
        );
    }
    if (!mainImage && selectedAttrs?.size) {
        return renderGridVisualizer();
    }
    if (product.modelUrl && !selectedVariant && !isZoomed) {
        return <ModelViewer src={product.modelUrl} poster={mainImage || ""} alt={`3D model of ${getLocalized(product.name)}`} />;
    }
    if (mainImage) {
        return (
            <div className={cn("relative w-full h-full", isZoomed ? "min-h-[80vh]" : "")}>
                <Image src={mainImage} alt={getLocalized(product.name)} fill className="object-contain transition-all duration-500" priority />
            </div>
        );
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
                        <DialogClose className="absolute top-6 right-6 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors cursor-pointer z-50">
                           <X size={24} className="text-slate-800" />
                        </DialogClose>
                    </div>
                </DialogContent>
             </Dialog>
             <div className="absolute top-6 left-6 z-20">
                 <Badge variant={currentStock > 0 ? "secondary" : "destructive"} className="px-3 py-1 shadow-md bg-white/90 backdrop-blur">
                    {currentStock > 0 ? t('inStock') : t('outOfStock')}
                 </Badge>
             </div>
         </div>
      </div>

      <div className="lg:col-span-4 space-y-8 py-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <span>{product.category ? getLocalized(product.category.name) : "Collection"}</span>
            <ChevronRight size={14}/>
            <span>{getLocalized(product.name)}</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">{getLocalized(product.name)}</h1>
          <p className="text-3xl font-medium text-slate-900">€{(currentPrice / 100).toFixed(2)}</p>
        </div>

        {variants.length > 0 && (
          <div className="space-y-6 pt-6 border-t border-slate-100">
            <div className="space-y-3">
                <div className="flex justify-between"><label className="text-sm font-bold text-slate-900">Finish</label><span className="text-xs text-slate-500">{selectedAttrs?.color}</span></div>
                <div className="flex flex-wrap gap-3">
                {variants.map((v) => {
                    const attrs = v.attributes as VariantAttributes;
                    const isSelected = selectedVariantId === v.id;
                    return (
                        <button key={v.id} onClick={() => setSelectedVariantId(v.id)} 
                            className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all", isSelected ? "ring-2 ring-offset-2 ring-slate-900 scale-110" : "border hover:scale-105")} 
                            style={{ backgroundColor: attrs.colorCode || "#eee" }}>
                            {isSelected && attrs.colorCode && <Check size={12} className="text-white drop-shadow-md"/>}
                        </button>
                    );
                })}
                </div>
            </div>
          </div>
        )}

        <AddToCartButton stock={currentStock} text={t('addToCart')}
            data={{ 
                id: product.id, 
                variantId: selectedVariant?.id, 
                variantName: selectedVariant ? getLocalized(selectedVariant.name) : "Standard", 
                name: getLocalized(product.name), 
                slug: product.slug, 
                price: currentPrice, 
                image: mainImage || "", 
                categoryName: product.category ? getLocalized(product.category.name) : "" 
            }}
            className="w-full h-14 text-lg bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xl"
        />

        <Tabs defaultValue="desc" className="w-full pt-4">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl">
                <TabsTrigger value="desc" className="rounded-lg">About</TabsTrigger>
                <TabsTrigger value="delivery" className="rounded-lg">Shipping</TabsTrigger>
            </TabsList>
            <TabsContent value="desc" className="mt-4 prose prose-sm text-slate-600">
                {getLocalized(product.longDescription) || getLocalized(product.description)}
            </TabsContent>
            <TabsContent value="delivery" className="mt-4 text-sm text-slate-600"><p>Free delivery on all orders. Ships in 2-3 weeks.</p></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}