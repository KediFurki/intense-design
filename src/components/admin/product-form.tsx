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
import { Plus, Trash2, Box, Layers, Palette, Ruler, Hammer, ChevronDown, ChevronUp, Wand2, FileText } from "lucide-react";

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
    longDescription?: string | null;
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

  const [formState, setFormState] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    longDescription: initialData?.longDescription || "",
    price: initialData ? initialData.price / 100 : 0,
    stock: initialData?.stock || 0,
    categoryId: initialData?.categoryId || "",
    width: initialData?.width || "",
    height: initialData?.height || "",
    depth: initialData?.depth || ""
  });

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

  // DÜZELTME BURADA: 'any' yerine 'string | number'
  const handleChange = (field: string, value: string | number) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    Object.entries(formState).forEach(([key, value]) => {
        formData.append(key, String(value));
    });

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
                                <div className="space-y-2">
                                    <Label>{t('name')}</Label>
                                    <Input value={formState.name} onChange={(e) => handleChange('name', e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('slug')}</Label>
                                    <Input value={formState.slug} onChange={(e) => handleChange('slug', e.target.value)} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Short Description</Label>
                                <Textarea value={formState.description} onChange={(e) => handleChange('description', e.target.value)} rows={3} />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2"><FileText size={14}/> Detailed Description</Label>
                                <Textarea value={formState.longDescription} onChange={(e) => handleChange('longDescription', e.target.value)} rows={6} />
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>{t('price')} (€)</Label>
                                    <Input type="number" step="0.01" value={formState.price} onChange={(e) => handleChange('price', e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('stock')}</Label>
                                    <Input type="number" value={formState.stock} onChange={(e) => handleChange('stock', e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('category')}</Label>
                                    <Select value={formState.categoryId} onValueChange={(val) => handleChange('categoryId', val)}>
                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
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
                                <Input placeholder="W" type="number" value={formState.width} onChange={(e) => handleChange('width', e.target.value)} />
                                <Input placeholder="H" type="number" value={formState.height} onChange={(e) => handleChange('height', e.target.value)} />
                                <Input placeholder="D" type="number" value={formState.depth} onChange={(e) => handleChange('depth', e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card><CardContent className="p-6 space-y-4"><Label>{t('productImages')}</Label><ImageUpload value={images} onChange={(url) => setImages([...images, url])} onRemove={(url) => setImages(images.filter((i) => i !== url))} /></CardContent></Card>
                    <Card><CardContent className="p-6 space-y-4"><Label>{t('3dModel')}</Label><FileUpload value={modelUrl} onChange={(url) => setModelUrl(url)} onRemove={() => setModelUrl("")} /><p className="text-xs text-muted-foreground">{t('upload3dDesc')}</p></CardContent></Card>
                    
                    <Card className="border-blue-200 bg-blue-50/50">
                        <CardContent className="p-6 space-y-4">
                            <Label className="flex items-center gap-2 text-blue-800"><Wand2 size={16}/> AI Color Mask</Label>
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
                                            <Input placeholder="Color (Red)" value={variant.color} onChange={(e) => updateVariant(index, 'color', e.target.value)} />
                                            <div className="w-16 h-10 border rounded overflow-hidden relative cursor-pointer">
                                                <input type="color" className="absolute -top-2 -left-2 w-20 h-20 p-0 cursor-pointer" value={variant.colorCode || "#000000"} onChange={(e) => updateVariant(index, 'colorCode', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input placeholder="Size (XL)" value={variant.size} onChange={(e) => updateVariant(index, 'size', e.target.value)} />
                                            <Input placeholder="Material" value={variant.material} onChange={(e) => updateVariant(index, 'material', e.target.value)} />
                                        </div>
                                        <div className="flex gap-2">
                                            <Input type="number" placeholder="Price" step="0.01" value={variant.price} onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)} />
                                            <Input type="number" placeholder="Stock" value={variant.stock} onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Variant Images</Label>
                                        <ImageUpload value={variant.images} onChange={(url) => updateVariant(index, 'images', [...variant.images, url])} onRemove={(url) => updateVariant(index, 'images', variant.images.filter(i => i !== url))} />
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