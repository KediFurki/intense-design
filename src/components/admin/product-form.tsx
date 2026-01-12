"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUpload from "@/components/ui/image-upload";
import FileUpload from "@/components/ui/file-upload";
import { useState } from "react";
import { createProduct, updateProduct } from "@/server/actions/products";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Box, Layers, Palette, Ruler, Hammer } from "lucide-react";

// Form State'i için kullandığımız Varyasyon Tipi
type Variant = {
  id?: string;
  name: string;
  price: number;
  stock: number;
  image: string | null;
  color?: string;
  size?: string;
  material?: string;
};

// Veritabanından gelen Attributes yapısını tanımlıyoruz
type VariantAttributes = {
  color?: string;
  size?: string;
  material?: string;
};

// Veritabanından gelen Ürün Tipi
type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  categoryId: string | null;
  images: string[] | null;
  modelUrl: string | null;
  width: number | null;
  height: number | null;
  depth: number | null;
  // DÜZELTME 1: 'any[]' yerine gerçek yapı tanımlandı
  variants?: {
    id: string;
    name: string;
    price: number;
    stock: number;
    image: string | null;
    attributes: unknown; // Drizzle JSON verisini unknown olarak getirir
  }[]; 
};

type Category = {
  id: string;
  name: string;
};

export default function ProductForm({
  initialData,
  categories,
}: {
  initialData?: Product | null;
  categories: Category[];
}) {
  const t = useTranslations("Admin");
  const [loading, setLoading] = useState(false);

  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [modelUrl, setModelUrl] = useState<string>(initialData?.modelUrl || "");
  
  // Veritabanından gelen veriyi forma hazırlama
  const [variants, setVariants] = useState<Variant[]>(
    initialData?.variants 
      ? initialData.variants.map(v => {
          // DÜZELTME 2: 'any' yerine güvenli tip dönüşümü (Type Casting)
          const attrs = v.attributes as VariantAttributes;
          
          return {
            id: v.id,
            name: v.name,
            price: v.price / 100,
            stock: v.stock,
            image: v.image,
            // Attributes içindeki verileri güvenli şekilde çekiyoruz
            color: attrs?.color || "",
            size: attrs?.size || "",
            material: attrs?.material || "",
          };
        }) 
      : []
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    formData.set("images", JSON.stringify(images));
    if (modelUrl) formData.set("modelUrl", modelUrl);
    formData.set("variants", JSON.stringify(variants));

    const result = initialData
      ? await updateProduct(initialData.id, formData)
      : await createProduct(formData);

    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success(initialData ? "Product updated" : "Product created");
    }
  };

  const addVariant = () => {
    setVariants([...variants, { name: "", price: 0, stock: 0, image: null, color: "", size: "", material: "" }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number | null) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
         <h2 className="text-3xl font-bold tracking-tight">{initialData ? t('edit') : t('create')} Product</h2>
         <Button type="submit" disabled={loading} className="cursor-pointer">
            {loading ? "Saving..." : t('save')}
         </Button>
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="general" className="gap-2"><Box size={16}/> General Info</TabsTrigger>
          <TabsTrigger value="variants" className="gap-2"><Layers size={16}/> Variants ({variants.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-2 space-y-4">
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>{t('name')}</Label>
                                    <Input name="name" defaultValue={initialData?.name} required placeholder="Modern Sofa" />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('slug')}</Label>
                                    <Input name="slug" defaultValue={initialData?.slug} required placeholder="modern-sofa" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('description')}</Label>
                                <Textarea name="description" defaultValue={initialData?.description || ""} rows={5} />
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>{t('price')} (€)</Label>
                                    <Input name="price" type="number" step="0.01" defaultValue={initialData ? initialData.price / 100 : ""} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('stock')}</Label>
                                    <Input name="stock" type="number" defaultValue={initialData?.stock} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('category')}</Label>
                                    <Select name="categoryId" defaultValue={initialData?.categoryId || undefined}>
                                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c.id} value={c.id} className="cursor-pointer">{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <Label className="mb-4 block">{t('dimensions')}</Label>
                            <div className="grid grid-cols-3 gap-4">
                                <Input name="width" placeholder="Width" type="number" defaultValue={initialData?.width || ""} />
                                <Input name="height" placeholder="Height" type="number" defaultValue={initialData?.height || ""} />
                                <Input name="depth" placeholder="Depth" type="number" defaultValue={initialData?.depth || ""} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <Label>{t('productImages')}</Label>
                            <ImageUpload 
                                value={images} 
                                onChange={(url) => setImages([...images, url])}
                                onRemove={(url) => setImages(images.filter((i) => i !== url))}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <Label>{t('3dModel')}</Label>
                            <FileUpload 
                                value={modelUrl} 
                                onChange={(url) => setModelUrl(url)}
                                onRemove={() => setModelUrl("")}
                            />
                            <p className="text-xs text-muted-foreground">{t('upload3dDesc')}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TabsContent>

        {/* --- VARYASYONLAR --- */}
        <TabsContent value="variants" className="mt-4">
            <Card>
                <CardContent className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h3 className="font-semibold text-lg">Detailed Variants</h3>
                            <p className="text-sm text-muted-foreground">Define colors, sizes and materials separately.</p>
                        </div>
                        <Button type="button" onClick={addVariant} variant="secondary" className="cursor-pointer border border-slate-200">
                            <Plus size={16} className="mr-2" /> Add Variant
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {variants.length === 0 ? (
                            <div className="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground">
                                No variants added yet.
                            </div>
                        ) : (
                            variants.map((variant, index) => (
                                <div key={index} className="flex flex-col sm:flex-row gap-6 p-4 border rounded-xl bg-slate-50 animate-in fade-in slide-in-from-top-2 relative">
                                    
                                    {/* Resim Alanı */}
                                    <div className="w-full sm:w-24 h-24 shrink-0 bg-white border rounded-lg overflow-hidden flex items-center justify-center">
                                        {variant.image ? (
                                            <div className="relative w-full h-full group">
                                                 {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={variant.image} alt="v" className="object-cover w-full h-full" />
                                                <button 
                                                    type="button"
                                                    onClick={() => updateVariant(index, 'image', null)}
                                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                                                >
                                                    <Trash2 size={16}/>
                                                </button>
                                            </div>
                                        ) : (
                                            <ImageUpload 
                                                value={[]} 
                                                onChange={(url) => updateVariant(index, 'image', url)}
                                                onRemove={() => {}}
                                            />
                                        )}
                                    </div>
                                    
                                    {/* Detay Alanları - Grid Yapısı */}
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* ÖZELLİKLER GRUBU */}
                                        <div className="space-y-3 p-3 bg-white rounded-lg border border-slate-100">
                                            <Label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Palette size={12}/> Color</Label>
                                            <Input 
                                                value={variant.color || ""} 
                                                onChange={(e) => updateVariant(index, 'color', e.target.value)} 
                                                placeholder="e.g. Navy Blue"
                                                className="h-8 text-sm"
                                            />
                                            
                                            <Label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Ruler size={12}/> Size</Label>
                                            <Input 
                                                value={variant.size || ""} 
                                                onChange={(e) => updateVariant(index, 'size', e.target.value)} 
                                                placeholder="e.g. XL or 200cm"
                                                className="h-8 text-sm"
                                            />
                                        </div>

                                        <div className="space-y-3 p-3 bg-white rounded-lg border border-slate-100">
                                            <Label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Hammer size={12}/> Material</Label>
                                            <Input 
                                                value={variant.material || ""} 
                                                onChange={(e) => updateVariant(index, 'material', e.target.value)} 
                                                placeholder="e.g. Velvet"
                                                className="h-8 text-sm"
                                            />
                                        </div>

                                        {/* FİYAT & STOK GRUBU */}
                                        <div className="space-y-3 p-3 bg-white rounded-lg border border-slate-100">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label className="text-xs font-bold text-slate-500">Price (€)</Label>
                                                    <Input 
                                                        type="number" 
                                                        step="0.01"
                                                        value={variant.price} 
                                                        onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value))} 
                                                        className="h-8 text-sm font-semibold"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs font-bold text-slate-500">Stock</Label>
                                                    <Input 
                                                        type="number" 
                                                        value={variant.stock} 
                                                        onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value))} 
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Silme Butonu */}
                                    <div className="flex items-start justify-end sm:justify-start">
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => removeVariant(index)}
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}