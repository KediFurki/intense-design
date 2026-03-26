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
import { useState, useEffect } from "react";
import { createProduct, updateProduct } from "@/server/actions/products";
import type { ProductInput } from "@/server/actions/products";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Box, Layers, Globe, Wand2, Bed, Armchair, Lamp, Utensils } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

/* ─── Constants ─── */
const LOCALES = ["en", "tr", "de", "bg"] as const;
type Locale = (typeof LOCALES)[number];
type LocalizedString = Record<Locale, string>;

const LOCALE_LABELS: Record<Locale, string> = { en: "EN", tr: "TR", de: "DE", bg: "BG" };

const PRODUCT_TYPES = {
  furniture: { label: "General Furniture", icon: Box },
  sofa: { label: "Sofa / Armchair", icon: Armchair },
  bed: { label: "Bed / Mattress", icon: Bed },
  kitchen: { label: "Kitchen Unit", icon: Utensils },
  lighting: { label: "Lighting", icon: Lamp },
  decoration: { label: "Decoration", icon: Box },
};

type ProductTypeKey = keyof typeof PRODUCT_TYPES;

/* ─── Zod Schema ─── */
const localizedNameSchema = z.object({
  en: z.string().min(1, "English name is required"),
  tr: z.string(),
  de: z.string(),
  bg: z.string(),
});

const localizedDescSchema = z.object({
  en: z.string(),
  tr: z.string(),
  de: z.string(),
  bg: z.string(),
});

const productFormSchema = z.object({
  name: localizedNameSchema,
  description: localizedDescSchema,
  longDescription: localizedDescSchema,
  slug: z.string().min(1, "Slug is required"),
  price: z.number().min(0),
  stock: z.number().min(0),
  categoryId: z.string().min(1, "Category is required"),
  type: z.string(),
  width: z.string(),
  height: z.string(),
  depth: z.string(),
  images: z.array(z.string()),
  modelUrl: z.string(),
  maskImage: z.string(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

/* ─── Helpers ─── */
const emptyLocalized = (): LocalizedString => ({ en: "", tr: "", de: "", bg: "" });

function parseLocalized(val: unknown): LocalizedString {
  if (!val) return emptyLocalized();
  if (typeof val === "string") return { ...emptyLocalized(), en: val };
  const obj = val as Record<string, string>;
  return { en: obj.en || "", tr: obj.tr || "", de: obj.de || "", bg: obj.bg || "" };
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ─── Variant Types ─── */
type VariantAttributes = {
  color: string;
  material?: string;
  width?: string;
  height?: string;
  depth?: string;
  fabricType?: string;
  storage?: boolean;
  headboardHeight?: string;
  [key: string]: string | number | boolean | undefined;
};

type Variant = {
  id?: string;
  names: LocalizedString;
  price: number;
  stock: number;
  images: string[];
  attributes: VariantAttributes;
  isOpen?: boolean;
};

/* ─── Component ─── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ProductForm({ initialData, categories }: { initialData?: any; categories: any[] }) {
  const t = useTranslations("Admin");

  /* ── React Hook Form ── */
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: parseLocalized(initialData?.name),
      description: parseLocalized(initialData?.description),
      longDescription: parseLocalized(initialData?.longDescription),
      slug: initialData?.slug || "",
      price: initialData ? initialData.price / 100 : 0,
      stock: initialData?.stock || 0,
      categoryId: initialData?.categoryId || "",
      type: initialData?.type || "furniture",
      width: initialData?.width ? String(initialData.width) : "",
      height: initialData?.height ? String(initialData.height) : "",
      depth: initialData?.depth ? String(initialData.depth) : "",
      images: initialData?.images || [],
      modelUrl: initialData?.modelUrl || "",
      maskImage: initialData?.maskImage || "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  // Auto-slug from English name (new products only)
  const nameEn = watch("name.en");
  useEffect(() => {
    if (!initialData?.id && nameEn) {
      setValue("slug", slugify(nameEn), { shouldValidate: true });
    }
  }, [nameEn, initialData?.id, setValue]);

  // Watched values for controlled components
  const watchedImages = watch("images");
  const watchedModelUrl = watch("modelUrl");
  const watchedMaskImage = watch("maskImage");
  const watchedCategoryId = watch("categoryId");
  const watchedType = watch("type") as ProductTypeKey;
  const watchedWidth = watch("width");
  const watchedHeight = watch("height");
  const watchedDepth = watch("depth");
  const watchedPrice = watch("price");

  /* ── Variants (manual state) ── */
  const [variants, setVariants] = useState<Variant[]>(
    initialData?.variants
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? initialData.variants.map((v: any) => ({
          id: v.id,
          names: parseLocalized(v.name),
          price: v.price / 100,
          stock: v.stock,
          images: Array.isArray(v.images) ? v.images : [],
          attributes: { color: "#000000", ...v.attributes },
          isOpen: false,
        }))
      : []
  );

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        names: emptyLocalized(),
        price: watchedPrice,
        stock: 10,
        images: [],
        attributes: {
          color: "#000000", material: "",
          width: watchedWidth || "", height: watchedHeight || "", depth: watchedDepth || "",
        },
        isOpen: true,
      },
    ]);
  };

  const updateVariantAttr = (index: number, key: string, val: string | number | boolean) => {
    const newV = [...variants];
    newV[index].attributes = { ...newV[index].attributes, [key]: val };
    setVariants(newV);
  };

  /* ── Submit ── */
  const onSubmit = async (data: ProductFormValues) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cleanVariants = variants.map(({ isOpen, ...rest }) => rest);

    const input: ProductInput = {
      name: data.name,
      description: data.description,
      longDescription: data.longDescription,
      slug: data.slug,
      price: data.price,
      stock: data.stock,
      categoryId: data.categoryId,
      type: data.type as ProductInput["type"],
      width: data.width ? Number(data.width) : null,
      height: data.height ? Number(data.height) : null,
      depth: data.depth ? Number(data.depth) : null,
      images: data.images,
      modelUrl: data.modelUrl || null,
      maskImage: data.maskImage || null,
      variants: cleanVariants,
    };

    const result = initialData
      ? await updateProduct(initialData.id, input)
      : await createProduct(input);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(initialData ? "Product Updated" : "Product Created");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-6xl space-y-8 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-white/90 py-4 backdrop-blur">
        <h2 className="text-3xl font-bold tracking-tight">
          {initialData ? t("edit") : t("create")} Product
        </h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => globalThis.history.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-stone-900 text-white hover:bg-stone-800 rounded-xl cursor-pointer">
            {isSubmitting ? "Saving..." : t("save")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ─── LEFT COLUMN: Localized Content ─── */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe size={18} /> Product Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="en">
                <TabsList className="mb-4 grid w-full grid-cols-4">
                  {LOCALES.map((loc) => (
                    <TabsTrigger key={loc} value={loc} className="uppercase">
                      {LOCALE_LABELS[loc]}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {LOCALES.map((loc) => (
                  <TabsContent key={loc} value={loc} className="space-y-4 animate-in fade-in slide-in-from-left-2">
                    <div className="space-y-2">
                      <Label>
                        Product Name ({LOCALE_LABELS[loc]})
                        {loc === "en" && <span className="ml-1 text-red-500">*</span>}
                      </Label>
                      <Input {...register(`name.${loc}` as const)} placeholder="e.g. Modern Sofa" />
                      {loc === "en" && errors.name?.en && (
                        <p className="text-xs text-red-500">{errors.name.en.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Short Description ({LOCALE_LABELS[loc]})</Label>
                      <Textarea {...register(`description.${loc}` as const)} rows={2} />
                    </div>
                    <div className="space-y-2">
                      <Label>Detailed Story ({LOCALE_LABELS[loc]})</Label>
                      <Textarea {...register(`longDescription.${loc}` as const)} rows={5} />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Variants */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Layers size={18} /> Variants & Options</CardTitle>
              <Button type="button" onClick={addVariant} variant="outline" size="sm"><Plus size={16} className="mr-1" /> Add Variant</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {variants.map((variant, index) => (
                <div key={index} className="group relative space-y-5 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Variant #{index + 1}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setVariants(variants.filter((_, i) => i !== index))} className="h-8 w-8 text-red-500 hover:bg-red-50"><Trash2 size={16} /></Button>
                  </div>

                  {/* ── Variant Localized Names (Tabs) ── */}
                  <div className="rounded-lg border border-stone-100 bg-stone-50/50 p-3">
                    <Label className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <Globe size={12} /> Variant Name
                    </Label>
                    <Tabs defaultValue="en" className="w-full">
                      <TabsList className="mb-2 grid w-full grid-cols-4">
                        {LOCALES.map((loc) => (
                          <TabsTrigger key={loc} value={loc} className="h-6 text-[10px] uppercase">{LOCALE_LABELS[loc]}</TabsTrigger>
                        ))}
                      </TabsList>
                      {LOCALES.map((loc) => (
                        <TabsContent key={loc} value={loc}>
                          <Input
                            placeholder={`Variant name (${LOCALE_LABELS[loc]})`}
                            className="h-9 bg-white"
                            value={variant.names[loc] || ""}
                            onChange={(e) => { const newV = [...variants]; newV[index].names = { ...newV[index].names, [loc]: e.target.value }; setVariants(newV); }}
                          />
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>

                  {/* ── 3D Color Hex Code ── */}
                  <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3">
                    <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-violet-800">
                      <Box size={14} /> Color Hex Code (For 3D Model)
                    </Label>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 shrink-0 rounded-lg border-2 border-violet-300 shadow-inner"
                        style={{ backgroundColor: variant.attributes.color || "#000000" }}
                      />
                      <div className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-violet-200">
                        <input
                          type="color"
                          className="absolute -left-2 -top-2 h-16 w-16 cursor-pointer p-0"
                          value={variant.attributes.color || "#000000"}
                          onChange={(e) => updateVariantAttr(index, "color", e.target.value)}
                        />
                      </div>
                      <Input
                        className="h-10 flex-1 font-mono text-sm"
                        placeholder="#b05c45"
                        value={variant.attributes.color || ""}
                        onChange={(e) => updateVariantAttr(index, "color", e.target.value)}
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] text-violet-600">This hex code will be used for 3D model dynamic color rendering.</p>
                  </div>

                  {/* Material */}
                  <div className="space-y-2">
                    <Label>Material / Fabric</Label>
                    <Input placeholder="e.g. Velvet, Oak Wood" value={variant.attributes.material || ""} onChange={(e) => updateVariantAttr(index, "material", e.target.value)} />
                  </div>

                  {/* Variant Dimensions */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Variant Dimensions (If different from base)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="relative"><span className="absolute left-2 top-1.5 text-xs font-bold text-stone-400">W</span><Input className="pl-6" placeholder="Width" value={variant.attributes.width || ""} onChange={(e) => updateVariantAttr(index, "width", e.target.value)} /></div>
                      <div className="relative"><span className="absolute left-2 top-1.5 text-xs font-bold text-stone-400">H</span><Input className="pl-6" placeholder="Height" value={variant.attributes.height || ""} onChange={(e) => updateVariantAttr(index, "height", e.target.value)} /></div>
                      <div className="relative"><span className="absolute left-2 top-1.5 text-xs font-bold text-stone-400">D</span><Input className="pl-6" placeholder="Depth" value={variant.attributes.depth || ""} onChange={(e) => updateVariantAttr(index, "depth", e.target.value)} /></div>
                    </div>
                  </div>

                  {/* Dynamic Fields (Product Type) */}
                  {watchedType === "bed" && (
                    <div className="grid grid-cols-2 gap-4 rounded-lg border border-amber-200 bg-amber-50/50 p-3 animate-in fade-in">
                      <div className="space-y-2">
                        <Label className="text-amber-900">Headboard Height</Label>
                        <Input placeholder="e.g. 120cm" value={variant.attributes.headboardHeight || ""} onChange={(e) => updateVariantAttr(index, "headboardHeight", e.target.value)} />
                      </div>
                      <div className="mt-8 flex items-center gap-2">
                        <input type="checkbox" id={`storage-${index}`} checked={!!variant.attributes.storage} onChange={(e) => updateVariantAttr(index, "storage", e.target.checked)} className="h-4 w-4" />
                        <Label htmlFor={`storage-${index}`} className="cursor-pointer text-amber-900">Has Storage (Baza)?</Label>
                      </div>
                    </div>
                  )}

                  {watchedType === "sofa" && (
                    <div className="grid grid-cols-2 gap-4 rounded-lg border border-orange-100 bg-orange-50/50 p-3 animate-in fade-in">
                      <div className="space-y-2">
                        <Label className="text-orange-900">Fabric Type</Label>
                        <Input placeholder="e.g. Linen, Leather" value={variant.attributes.fabricType || ""} onChange={(e) => updateVariantAttr(index, "fabricType", e.target.value)} />
                      </div>
                    </div>
                  )}

                  {/* Price & Stock & Images */}
                  <div className="grid grid-cols-3 gap-4 border-t pt-3">
                    <div className="space-y-1"><Label className="text-xs">Price (€)</Label><Input type="number" value={variant.price} onChange={(e) => { const newV = [...variants]; newV[index].price = parseFloat(e.target.value); setVariants(newV); }} /></div>
                    <div className="space-y-1"><Label className="text-xs">Stock</Label><Input type="number" value={variant.stock} onChange={(e) => { const newV = [...variants]; newV[index].stock = parseInt(e.target.value); setVariants(newV); }} /></div>
                    <div className="space-y-1"><Label className="text-xs">Images</Label><ImageUpload value={variant.images} onChange={(url) => { const newV = [...variants]; newV[index].images = [...newV[index].images, url]; setVariants(newV); }} onRemove={(url) => { const newV = [...variants]; newV[index].images = variant.images.filter(i => i !== url); setVariants(newV); }} /></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ─── RIGHT COLUMN: Universal Settings ─── */}
        <div className="space-y-6">
          {/* Category + Type + Slug */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <Label>Category <span className="text-red-500">*</span></Label>
                <Select value={watchedCategoryId} onValueChange={(val) => setValue("categoryId", val, { shouldValidate: true })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name?.en || c.name?.tr || "Category"}</SelectItem>))}</SelectContent>
                </Select>
                {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Product Type</Label>
                <Select value={watchedType} onValueChange={(val) => setValue("type", val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRODUCT_TYPES).map(([key, conf]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2"><conf.icon size={16} /> {conf.label}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Sets specific fields like Storage for Beds.</p>
              </div>

              <div className="space-y-2">
                <Label>Slug</Label>
                <Input {...register("slug")} />
                {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Stock */}
          <Card>
            <CardHeader><CardTitle>Pricing & Stock</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Base Price (€)</Label><Input type="number" step="0.01" {...register("price", { valueAsNumber: true })} /></div>
              <div className="space-y-2"><Label>Total Stock</Label><Input type="number" {...register("stock", { valueAsNumber: true })} /></div>
            </CardContent>
          </Card>

          {/* Dimensions */}
          <Card>
            <CardHeader><CardTitle>Base Dimensions</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              <Input placeholder="W" type="number" {...register("width")} />
              <Input placeholder="H" type="number" {...register("height")} />
              <Input placeholder="D" type="number" {...register("depth")} />
            </CardContent>
          </Card>

          {/* Media */}
          <Card>
            <CardHeader><CardTitle>Media</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Base Images</Label>
                <ImageUpload value={watchedImages} onChange={(url) => setValue("images", [...watchedImages, url])} onRemove={(url) => setValue("images", watchedImages.filter((i) => i !== url))} />
              </div>
              <div className="space-y-2">
                <Label>3D Model</Label>
                <FileUpload value={watchedModelUrl} onChange={(url) => setValue("modelUrl", url)} onRemove={() => setValue("modelUrl", "")} />
              </div>
              <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                <Label className="flex items-center gap-2 text-amber-800"><Wand2 size={16} /> AI Mask</Label>
                <ImageUpload value={watchedMaskImage ? [watchedMaskImage] : []} onChange={(url) => setValue("maskImage", url)} onRemove={() => setValue("maskImage", "")} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}