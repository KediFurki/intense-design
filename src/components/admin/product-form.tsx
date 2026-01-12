"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUpload from "@/components/ui/image-upload";
import FileUpload from "@/components/ui/file-upload";
import { useState } from "react";
import { createProduct, updateProduct } from "@/server/actions/products";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Box, Layers, Palette, Ruler, Hammer, ChevronDown, ChevronUp, Wand2 } from "lucide-react";

type Variant = {
  id?: string;
  name: string;
  price: number;
  stock: number;
  images: string[];
  modelUrl: string | null;
  color?: string;
  colorCode?: string;
  size?: string;
  material?: string;
  isOpen?: boolean;
};

type VariantAttributes = {
  color?: string;
  colorCode?: string;
  size?: string;
  material?: string;
};

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
    maskImage: string | null;
    width: number | null;
    height: number | null;
    depth: number | null;
    variants?: {
        id: string;
        name: string;
        price: number;
        stock: number;
        images: unknown;
        modelUrl: string | null;
        attributes: unknown;
    }[];
};

type Category = { id: string; name: string; };

export default function ProductForm({ initialData, categories }: { initialData?: Product | null; categories: Category[]; }) {
  const t = useTranslations("Admin");
  const [loading, setLoading] = useState(false);

  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [modelUrl, setModelUrl] = useState<string>(initialData?.modelUrl || "");
  const [maskImage, setMaskImage] = useState<string>(initialData?.maskImage || "");

  const [variants, setVariants] = useState<Variant[]>(
    initialData?.variants 
      ? initialData.variants.map(v => {
          const attrs = v.attributes as VariantAttributes;
          return {
            id: v.id,
            name: v.name,
            price: v.price / 100,
            stock: v.stock,
            images: Array.isArray(v.images) ? (v.images as string[]) : [],
            modelUrl: v.modelUrl,
            color: attrs?.color || "",
            colorCode: attrs?.colorCode || "#000000",
            size: attrs?.size || "",
            material: attrs?.material || "",
            isOpen: false
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
    if (maskImage) formData.set("maskImage", maskImage);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cleanVariants = variants.map(({ isOpen, ...rest }) => rest);
    formData.set("variants", JSON.stringify(cleanVariants));

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
    setVariants([...variants, { 
        name: "", price: 0, stock: 0, 
        images: [], modelUrl: null,
        color: "", colorCode: "#000000", size: "", material: "", 
        isOpen: true 
    }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number | string[] | boolean | null) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
       <div className="flex items-center justify-between">
         <h2 className="text-3xl font-bold tracking-tight">{initialData ? t('edit') : t('create')} Product</h2>
         <Button type="submit" disabled={loading} className="cursor-pointer">{loading ? "Saving..." : t('save')}</Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="general" className="gap-2"><Box size={16}/> General Info</TabsTrigger>
            <TabsTrigger value="variants" className="gap-2"><Layers size={16}/> Variants ({variants.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
             <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-2 space-y-4">
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2"><Label>{t('name')}</Label><Input name="name" defaultValue={initialData?.name} required /></div>
                                <div className="space-y-2"><Label>{t('slug')}</Label><Input name="slug" defaultValue={initialData?.slug} required /></div>
                            </div>
                            <div className="space-y-2"><Label>{t('description')}</Label><Textarea name="description" defaultValue={initialData?.description || ""} rows={5} /></div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2"><Label>{t('price')} (€)</Label><Input name="price" type="number" step="0.01" defaultValue={initialData ? initialData.price / 100 : ""} required /></div>
                                <div className="space-y-2"><Label>{t('stock')}</Label><Input name="stock" type="number" defaultValue={initialData?.stock} required /></div>
                                <div className="space-y-2"><Label>{t('category')}</Label>
                                    <Select name="categoryId" defaultValue={initialData?.categoryId || undefined}>
                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent>{categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
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
                    <Card><CardContent className="p-6 space-y-4"><Label>{t('productImages')}</Label><ImageUpload value={images} onChange={(url) => setImages([...images, url])} onRemove={(url) => setImages(images.filter((i) => i !== url))} /></CardContent></Card>
                    <Card><CardContent className="p-6 space-y-4"><Label>{t('3dModel')}</Label><FileUpload value={modelUrl} onChange={(url) => setModelUrl(url)} onRemove={() => setModelUrl("")} /><p className="text-xs text-muted-foreground">{t('upload3dDesc')}</p></CardContent></Card>
                    
                    <Card className="border-blue-200 bg-blue-50/50">
                        <CardContent className="p-6 space-y-4">
                            <Label className="flex items-center gap-2 text-blue-800"><Wand2 size={16}/> AI Color Mask (Optional)</Label>
                            <div className="text-xs text-blue-600 mb-2">Upload a grayscale mask image where white areas will be colored dynamically.</div>
                            <ImageUpload value={maskImage ? [maskImage] : []} onChange={(url) => setMaskImage(url)} onRemove={() => setMaskImage("")} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TabsContent>

        <TabsContent value="variants" className="mt-4">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Variants</h3>
                    <Button type="button" onClick={addVariant} variant="secondary"><Plus size={16} className="mr-2"/> Add Variant</Button>
                </div>

                {variants.map((variant, index) => (
                    <Card key={index} className="overflow-hidden border-slate-200">
                        <div className="bg-slate-50 p-4 flex items-center justify-between border-b">
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-slate-700">#{index + 1}</span>
                                <span className="text-sm font-medium">
                                    {[variant.color, variant.size].filter(Boolean).join(" / ") || "New Variant"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="ghost" size="sm" onClick={() => updateVariant(index, 'isOpen', !variant.isOpen)}>
                                    {variant.isOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => removeVariant(index)}>
                                    <Trash2 size={16}/>
                                </Button>
                            </div>
                        </div>
                        
                        {variant.isOpen && (
                            <CardContent className="p-6 space-y-6 animate-in slide-in-from-top-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <Label>Attributes</Label>
                                        <div className="flex gap-2">
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-xs text-muted-foreground">Color Name</Label>
                                                <Input placeholder="Red" value={variant.color} onChange={(e) => updateVariant(index, 'color', e.target.value)} />
                                            </div>
                                            <div className="w-16 space-y-1">
                                                <Label className="text-xs text-muted-foreground">Hex</Label>
                                                <div className="flex h-9 w-full items-center justify-center rounded-md border border-input bg-transparent px-3 py-1">
                                                     <input type="color" className="w-full h-full cursor-pointer p-0 border-0" value={variant.colorCode || "#000000"} onChange={(e) => updateVariant(index, 'colorCode', e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-xs text-muted-foreground">Size</Label>
                                                <Input placeholder="XL" value={variant.size} onChange={(e) => updateVariant(index, 'size', e.target.value)} />
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-xs text-muted-foreground">Price (€)</Label>
                                                <Input type="number" step="0.01" value={variant.price} onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value))} />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-xs text-muted-foreground">Stock</Label>
                                                <Input type="number" value={variant.stock} onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value))} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Variant Images (Show when selected)</Label>
                                        <ImageUpload 
                                            value={variant.images} 
                                            onChange={(url) => updateVariant(index, 'images', [...variant.images, url])} 
                                            onRemove={(url) => updateVariant(index, 'images', variant.images.filter(i => i !== url))}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                ))}
            </div>
        </TabsContent>
      </Tabs>
    </form>
  );
}