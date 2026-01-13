"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUpload from "@/components/ui/image-upload";
import FileUpload from "@/components/ui/file-upload";
import { useState } from "react";
import { createProduct, updateProduct } from "@/server/actions/products";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Box, Layers, Globe, Wand2, Bed, Armchair, Lamp, Utensils } from "lucide-react";

const LOCALES = ["en", "tr", "de", "bg"] as const;
type Locale = typeof LOCALES[number];

// ÜRÜN TİPLERİ VE İKONLARI
const PRODUCT_TYPES = {
  furniture: { label: "General Furniture", icon: Box },
  sofa: { label: "Sofa / Armchair", icon: Armchair },
  bed: { label: "Bed / Mattress", icon: Bed },
  kitchen: { label: "Kitchen Unit", icon: Utensils },
  lighting: { label: "Lighting", icon: Lamp },
  decoration: { label: "Decoration", icon: Box }
};

type ProductTypeKey = keyof typeof PRODUCT_TYPES;

type VariantAttributes = {
  color?: string;
  colorCode?: string;
  material?: string;
  // Detaylı Boyutlar
  width?: string;
  height?: string;
  depth?: string;
  // Tipe Özel Alanlar
  fabricType?: string;
  storage?: boolean; // Baza
  headboardHeight?: string;
  // Index signature
  [key: string]: string | number | boolean | undefined;
};

type Variant = {
  id?: string;
  names: Record<string, string>;
  price: number;
  stock: number;
  images: string[];
  attributes: VariantAttributes;
  isOpen?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ProductForm({ initialData, categories }: { initialData?: any; categories: any[]; }) {
  const t = useTranslations("Admin");
  const [loading, setLoading] = useState(false);

  // --- STATE ---
  const [names, setNames] = useState<Record<string, string>>(initialData?.name || { en: "", tr: "", de: "", bg: "" });
  const [descriptions, setDescriptions] = useState<Record<string, string>>(initialData?.description || { en: "", tr: "", de: "", bg: "" });
  const [longDescriptions, setLongDescriptions] = useState<Record<string, string>>(initialData?.longDescription || { en: "", tr: "", de: "", bg: "" });
  
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [price, setPrice] = useState(initialData ? initialData.price / 100 : 0);
  const [stock, setStock] = useState(initialData?.stock || 0);
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  
  // Ürün Tipi (Varsayılan furniture)
  const [productType, setProductType] = useState<ProductTypeKey>(initialData?.type || "furniture");

  // Ana Boyutlar
  const [width, setWidth] = useState(initialData?.width || "");
  const [height, setHeight] = useState(initialData?.height || "");
  const [depth, setDepth] = useState(initialData?.depth || "");

  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [modelUrl, setModelUrl] = useState<string>(initialData?.modelUrl || "");
  const [maskImage, setMaskImage] = useState<string>(initialData?.maskImage || "");

  const [variants, setVariants] = useState<Variant[]>(
    initialData?.variants 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? initialData.variants.map((v: any) => ({
          id: v.id,
          names: v.name || { en: "", tr: "" },
          price: v.price / 100,
          stock: v.stock,
          images: Array.isArray(v.images) ? v.images : [],
          attributes: v.attributes || {},
          isOpen: false
        })) 
      : []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("names", JSON.stringify(names));
    formData.append("descriptions", JSON.stringify(descriptions));
    formData.append("longDescriptions", JSON.stringify(longDescriptions));
    formData.append("slug", slug);
    formData.append("price", String(price));
    formData.append("stock", String(stock));
    if (categoryId) formData.append("categoryId", categoryId);
    formData.append("type", productType);
    if (width) formData.append("width", String(width));
    if (height) formData.append("height", String(height));
    if (depth) formData.append("depth", String(depth));
    formData.append("images", JSON.stringify(images));
    if (modelUrl) formData.append("modelUrl", modelUrl);
    if (maskImage) formData.append("maskImage", maskImage);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cleanVariants = variants.map(({ isOpen, ...rest }) => rest);
    formData.append("variants", JSON.stringify(cleanVariants));

    const result = initialData
      ? await updateProduct(initialData.id, formData)
      : await createProduct(formData);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(initialData ? "Product Updated" : "Product Created");
    }
    setLoading(false);
  };

  const addVariant = () => {
    setVariants([...variants, { 
        names: { en: "", tr: "", de: "", bg: "" }, 
        price: price, 
        stock: 10, 
        images: [], 
        attributes: { 
            color: "", colorCode: "#000000", material: "",
            width: width || "", height: height || "", depth: depth || "" 
        }, 
        isOpen: true 
    }]);
  };

  const updateVariantAttr = (index: number, key: string, val: string | number | boolean) => {
    const newV = [...variants];
    newV[index].attributes = { ...newV[index].attributes, [key]: val };
    setVariants(newV);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl pb-20">
       <div className="flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur z-50 py-4 border-b">
         <h2 className="text-3xl font-bold tracking-tight">{initialData ? t('edit') : t('create')} Product</h2>
         <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-slate-900 text-white hover:bg-slate-800">{loading ? "Saving..." : t('save')}</Button>
         </div>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        
        {/* SOL KOLON */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* ÇOKLU DİL İÇERİK (MANUEL) */}
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Globe size={18}/> Product Content</CardTitle></CardHeader>
                <CardContent>
                    <Tabs defaultValue="tr">
                        <TabsList className="grid w-full grid-cols-4 mb-4">
                            {LOCALES.map(loc => <TabsTrigger key={loc} value={loc} className="uppercase">{loc}</TabsTrigger>)}
                        </TabsList>
                        {LOCALES.map(loc => (
                            <TabsContent key={loc} value={loc} className="space-y-4 animate-in fade-in slide-in-from-left-2">
                                <div className="space-y-2">
                                    <Label>Product Name ({loc.toUpperCase()})</Label>
                                    <Input value={names[loc] || ""} onChange={(e) => setNames({...names, [loc]: e.target.value})} placeholder="e.g. Modern Sofa" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Short Description</Label>
                                    <Textarea value={descriptions[loc] || ""} onChange={(e) => setDescriptions({...descriptions, [loc]: e.target.value})} rows={2} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Detailed Story</Label>
                                    <Textarea value={longDescriptions[loc] || ""} onChange={(e) => setLongDescriptions({...longDescriptions, [loc]: e.target.value})} rows={5} />
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Layers size={18}/> Variants & Options</CardTitle>
                    <Button type="button" onClick={addVariant} variant="outline" size="sm"><Plus size={16} className="mr-1"/> Add Variant</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {variants.map((variant, index) => (
                        <div key={index} className="border rounded-lg p-5 space-y-5 bg-slate-50 relative group">
                            <div className="absolute top-4 right-4">
                                <Button type="button" variant="ghost" size="icon" onClick={() => setVariants(variants.filter((_, i) => i !== index))} className="text-red-500 hover:bg-red-100"><Trash2 size={16}/></Button>
                            </div>
                            <span className="text-xs font-bold uppercase text-slate-400">Variant #{index + 1}</span>

                            {/* 1. RENK & MATERYAL */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Color</Label>
                                    <div className="flex gap-2">
                                        <div className="relative w-10 h-10 rounded-md border overflow-hidden shrink-0 cursor-pointer shadow-sm">
                                            <input type="color" className="absolute -top-2 -left-2 w-16 h-16 p-0 cursor-pointer" 
                                                value={variant.attributes.colorCode || "#000000"} 
                                                onChange={(e) => updateVariantAttr(index, 'colorCode', e.target.value)} 
                                            />
                                        </div>
                                        <Input placeholder="Color Name (e.g. Navy Blue)" value={variant.attributes.color} onChange={(e) => updateVariantAttr(index, 'color', e.target.value)}/>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Material / Fabric</Label>
                                    <Input placeholder="e.g. Velvet, Oak Wood" value={variant.attributes.material} onChange={(e) => updateVariantAttr(index, 'material', e.target.value)}/>
                                </div>
                            </div>

                            {/* 2. AYRIŞTIRILMIŞ BOYUTLAR */}
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Variant Dimensions (If different from base)</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="relative"><span className="absolute left-2 top-1.5 text-xs text-slate-400 font-bold">W</span><Input className="pl-6" placeholder="Width" value={variant.attributes.width || ""} onChange={(e) => updateVariantAttr(index, 'width', e.target.value)} /></div>
                                    <div className="relative"><span className="absolute left-2 top-1.5 text-xs text-slate-400 font-bold">H</span><Input className="pl-6" placeholder="Height" value={variant.attributes.height || ""} onChange={(e) => updateVariantAttr(index, 'height', e.target.value)} /></div>
                                    <div className="relative"><span className="absolute left-2 top-1.5 text-xs text-slate-400 font-bold">D</span><Input className="pl-6" placeholder="Depth" value={variant.attributes.depth || ""} onChange={(e) => updateVariantAttr(index, 'depth', e.target.value)} /></div>
                                </div>
                            </div>

                            {/* 3. DİNAMİK ALANLAR (Ürün Tipine Göre) */}
                            {productType === 'bed' && (
                                <div className="p-3 bg-blue-50/50 rounded border border-blue-100 grid grid-cols-2 gap-4 animate-in fade-in">
                                    <div className="space-y-2">
                                        <Label className="text-blue-900">Headboard Height</Label>
                                        <Input placeholder="e.g. 120cm" value={variant.attributes.headboardHeight || ""} onChange={(e) => updateVariantAttr(index, 'headboardHeight', e.target.value)} />
                                    </div>
                                    <div className="flex items-center gap-2 mt-8">
                                        <input type="checkbox" id={`storage-${index}`} checked={!!variant.attributes.storage} onChange={(e) => updateVariantAttr(index, 'storage', e.target.checked)} className="w-4 h-4" />
                                        <Label htmlFor={`storage-${index}`} className="cursor-pointer text-blue-900">Has Storage (Baza)?</Label>
                                    </div>
                                </div>
                            )}

                            {productType === 'sofa' && (
                                <div className="p-3 bg-orange-50/50 rounded border border-orange-100 grid grid-cols-2 gap-4 animate-in fade-in">
                                    <div className="space-y-2">
                                        <Label className="text-orange-900">Fabric Type</Label>
                                        <Input placeholder="e.g. Linen, Leather" value={variant.attributes.fabricType || ""} onChange={(e) => updateVariantAttr(index, 'fabricType', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* 4. FİYAT & STOK & RESİM */}
                            <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                                <div className="space-y-1"><Label>Price (€)</Label><Input type="number" value={variant.price} onChange={(e) => { const newV = [...variants]; newV[index].price = parseFloat(e.target.value); setVariants(newV); }} /></div>
                                <div className="space-y-1"><Label>Stock</Label><Input type="number" value={variant.stock} onChange={(e) => { const newV = [...variants]; newV[index].stock = parseInt(e.target.value); setVariants(newV); }} /></div>
                                <div className="space-y-1"><Label>Images</Label><ImageUpload value={variant.images} onChange={(url) => { const newV = [...variants]; newV[index].images = [...newV[index].images, url]; setVariants(newV); }} onRemove={(url) => { const newV = [...variants]; newV[index].images = variant.images.filter(i=>i!==url); setVariants(newV); }} /></div>
                            </div>
                            
                            {/* DİL İSİMLERİ (Varyasyon İçin) */}
                            <div className="grid grid-cols-2 gap-2 mt-2 border-t pt-2">
                                {LOCALES.map(loc => (
                                    <div key={loc}><Label className="text-[10px] text-muted-foreground uppercase">{loc} Variant Name</Label><Input className="h-7 text-xs bg-white" placeholder="Name" value={variant.names[loc] || ""} onChange={(e) => { const newV = [...variants]; newV[index].names[loc] = e.target.value; setVariants(newV); }} /></div>
                                ))}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>

        {/* SAĞ KOLON: Ayarlar */}
        <div className="space-y-6">
            <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>{categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name?.en || c.name?.tr || "Category"}</SelectItem>))}</SelectContent>
                        </Select>
                    </div>
                    
                    {/* ÜRÜN TİPİ (ÖZELLİKLERİ DEĞİŞTİRİR) */}
                    <div className="space-y-2">
                        <Label>Product Type</Label>
                        <Select value={productType} onValueChange={(val) => setProductType(val as ProductTypeKey)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(PRODUCT_TYPES).map(([key, conf]) => (
                                    <SelectItem key={key} value={key}>
                                        <div className="flex items-center gap-2"><conf.icon size={16}/> {conf.label}</div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Sets specific fields like Storage for Beds.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Slug</Label>
                        <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Pricing & Stock</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                     <div className="space-y-2"><Label>Base Price (€)</Label><Input type="number" step="0.01" value={price} onChange={(e) => setPrice(parseFloat(e.target.value))} /></div>
                     <div className="space-y-2"><Label>Total Stock</Label><Input type="number" value={stock} onChange={(e) => setStock(parseInt(e.target.value))} /></div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Base Dimensions</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-3 gap-2">
                     <Input placeholder="W" type="number" value={width} onChange={(e) => setWidth(e.target.value)} />
                     <Input placeholder="H" type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
                     <Input placeholder="D" type="number" value={depth} onChange={(e) => setDepth(e.target.value)} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Media</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Base Images</Label><ImageUpload value={images} onChange={(url) => setImages([...images, url])} onRemove={(url) => setImages(images.filter((i) => i !== url))} /></div>
                    <div className="space-y-2"><Label>3D Model</Label><FileUpload value={modelUrl} onChange={setModelUrl} onRemove={() => setModelUrl("")} /></div>
                    <div className="space-y-2 p-3 bg-blue-50 rounded border border-blue-100"><Label className="flex items-center gap-2 text-blue-700"><Wand2 size={16}/> AI Mask</Label><ImageUpload value={maskImage ? [maskImage] : []} onChange={(url) => setMaskImage(url)} onRemove={() => setMaskImage("")} /></div>
                </CardContent>
            </Card>
        </div>
      </div>
    </form>
  );
}