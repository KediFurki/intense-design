"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUpload from "@/components/ui/image-upload";
import FileUpload from "@/components/ui/file-upload";
import { useState, useEffect } from "react";
import { createProduct, updateProduct } from "@/server/actions/products";
import type { ProductInput } from "@/server/actions/products";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Box, Layers, Globe, Wand2, Bed, Armchair, Lamp, Utensils, ArrowLeft, Save, Tag, Ruler, ImageIcon, Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

/* ─── Constants ─── */
const LOCALES = ["en", "tr", "de", "bg"] as const;
type Locale = (typeof LOCALES)[number];
type LocalizedString = Record<Locale, string>;

const LOCALE_LABELS: Record<Locale, string> = { en: "EN", tr: "TR", de: "DE", bg: "BG" };

const PRODUCT_TYPES = {
  furniture: { labelKey: "typeFurniture", icon: Box },
  sofa: { labelKey: "typeSofa", icon: Armchair },
  bed: { labelKey: "typeBed", icon: Bed },
  kitchen: { labelKey: "typeKitchen", icon: Utensils },
  lighting: { labelKey: "typeLighting", icon: Lamp },
  decoration: { labelKey: "typeDecoration", icon: Box },
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
      toast.success(initialData ? t("productUpdated") : t("productCreated"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-6xl space-y-8 pb-20">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-stone-200 bg-white/90 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" onClick={() => globalThis.history.back()} className="h-9 w-9 rounded-xl text-stone-500 hover:bg-stone-100 cursor-pointer">
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              {initialData ? t("editProduct") : t("newProduct")}
            </h2>
            <p className="text-xs text-stone-500">{initialData ? t("edit") : t("create")}</p>
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting} className="bg-stone-900 text-white hover:bg-stone-800 rounded-xl cursor-pointer gap-2">
          <Save size={16} />
          {isSubmitting ? t("saving") : t("save")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ─── LEFT COLUMN ─── */}
        <div className="space-y-6 lg:col-span-2">

          {/* Product Content Card */}
          <Card className="border-stone-200 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-stone-900">
                <Globe size={18} className="text-amber-700" /> {t("productContent")}
              </CardTitle>
              <CardDescription className="text-stone-500">{t("productName")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="en">
                <TabsList className="mb-4 w-full justify-start border-b border-stone-200 rounded-none h-auto p-0 bg-transparent gap-4">
                  {LOCALES.map((loc) => (
                    <TabsTrigger
                      key={loc}
                      value={loc}
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-700 data-[state=active]:text-amber-800 data-[state=active]:shadow-none py-2.5 px-1 font-medium text-stone-500 hover:text-stone-700 uppercase text-sm cursor-pointer"
                    >
                      {LOCALE_LABELS[loc]}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {LOCALES.map((loc) => (
                  <TabsContent key={loc} value={loc} className="space-y-4 animate-in fade-in slide-in-from-left-2">
                    <div className="space-y-2">
                      <Label className="text-stone-700">
                        {t("productName")} ({LOCALE_LABELS[loc]})
                        {loc === "en" && <span className="ml-1 text-red-500">*</span>}
                      </Label>
                      <Input {...register(`name.${loc}` as const)} placeholder={`${t("productName")} (${LOCALE_LABELS[loc]})`} className="border-stone-300 focus-visible:ring-amber-600" />
                      {loc === "en" && errors.name?.en && (
                        <p className="text-xs text-red-500">{errors.name.en.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-stone-700">{t("shortDescription")} ({LOCALE_LABELS[loc]})</Label>
                      <Textarea {...register(`description.${loc}` as const)} rows={2} className="border-stone-300 focus-visible:ring-amber-600" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-stone-700">{t("detailedStory")} ({LOCALE_LABELS[loc]})</Label>
                      <Textarea {...register(`longDescription.${loc}` as const)} rows={5} className="border-stone-300 focus-visible:ring-amber-600" />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Variants Card */}
          <Card className="border-stone-200 rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-stone-900">
                  <Layers size={18} className="text-amber-700" /> {t("variantsOptions")}
                </CardTitle>
                <CardDescription className="mt-1 text-stone-500">{variants.length > 0 ? `${variants.length} variant(s)` : ""}</CardDescription>
              </div>
              <Button type="button" onClick={addVariant} variant="outline" size="sm" className="border-stone-300 hover:bg-stone-50 rounded-xl cursor-pointer gap-1.5">
                <Plus size={16} /> {t("addVariant")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              {variants.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50/50 p-8 text-center">
                  <Package size={32} className="mb-2 text-stone-300" />
                  <p className="text-sm text-stone-500">{t("addVariant")}</p>
                </div>
              )}
              {variants.map((variant, index) => (
                <div key={index} className="group relative space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400">{t("variantNumber", { number: index + 1 })}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setVariants(variants.filter((_, i) => i !== index))} className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer">
                      <Trash2 size={16} />
                    </Button>
                  </div>

                  {/* Variant Localized Names */}
                  <div className="rounded-xl border border-stone-100 bg-stone-50/50 p-4">
                    <Label className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-stone-500">
                      <Globe size={12} /> {t("variantName")}
                    </Label>
                    <Tabs defaultValue="en" className="w-full">
                      <TabsList className="mb-2 w-full justify-start border-b border-stone-200 rounded-none h-auto p-0 bg-transparent gap-2">
                        {LOCALES.map((loc) => (
                          <TabsTrigger key={loc} value={loc} className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-600 data-[state=active]:text-amber-700 data-[state=active]:shadow-none py-1.5 px-1 text-[10px] uppercase font-medium text-stone-400 cursor-pointer">
                            {LOCALE_LABELS[loc]}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {LOCALES.map((loc) => (
                        <TabsContent key={loc} value={loc}>
                          <Input
                            placeholder={`${t("variantName")} (${LOCALE_LABELS[loc]})`}
                            className="h-9 border-stone-300 bg-white focus-visible:ring-amber-600"
                            value={variant.names[loc] || ""}
                            onChange={(e) => { const newV = [...variants]; newV[index].names = { ...newV[index].names, [loc]: e.target.value }; setVariants(newV); }}
                          />
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>

                  {/* Color Hex Code */}
                  <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
                    <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-violet-800">
                      <Box size={14} /> {t("colorHexCode")}
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
                        className="h-10 flex-1 font-mono text-sm border-violet-200 focus-visible:ring-violet-400"
                        placeholder="#b05c45"
                        value={variant.attributes.color || ""}
                        onChange={(e) => updateVariantAttr(index, "color", e.target.value)}
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] text-violet-600">{t("colorHexDesc")}</p>
                  </div>

                  {/* Material */}
                  <div className="space-y-2">
                    <Label className="text-stone-700">{t("materialFabric")}</Label>
                    <Input placeholder={t("materialFabric")} value={variant.attributes.material || ""} onChange={(e) => updateVariantAttr(index, "material", e.target.value)} className="border-stone-300 focus-visible:ring-amber-600" />
                  </div>

                  {/* Variant Dimensions */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-stone-500">{t("variantDimensions")} — {t("variantDimensionsHint")}</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="relative"><span className="absolute left-2.5 top-2 text-xs font-bold text-stone-400">W</span><Input className="pl-7 border-stone-300 focus-visible:ring-amber-600" placeholder={t("baseDimensions")} value={variant.attributes.width || ""} onChange={(e) => updateVariantAttr(index, "width", e.target.value)} /></div>
                      <div className="relative"><span className="absolute left-2.5 top-2 text-xs font-bold text-stone-400">H</span><Input className="pl-7 border-stone-300 focus-visible:ring-amber-600" placeholder={t("baseDimensions")} value={variant.attributes.height || ""} onChange={(e) => updateVariantAttr(index, "height", e.target.value)} /></div>
                      <div className="relative"><span className="absolute left-2.5 top-2 text-xs font-bold text-stone-400">D</span><Input className="pl-7 border-stone-300 focus-visible:ring-amber-600" placeholder={t("baseDimensions")} value={variant.attributes.depth || ""} onChange={(e) => updateVariantAttr(index, "depth", e.target.value)} /></div>
                    </div>
                  </div>

                  {/* Dynamic Fields (Product Type) */}
                  {watchedType === "bed" && (
                    <div className="grid grid-cols-2 gap-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4 animate-in fade-in">
                      <div className="space-y-2">
                        <Label className="text-amber-900">{t("headboardHeight")}</Label>
                        <Input placeholder="e.g. 120cm" value={variant.attributes.headboardHeight || ""} onChange={(e) => updateVariantAttr(index, "headboardHeight", e.target.value)} className="border-amber-200 focus-visible:ring-amber-500" />
                      </div>
                      <div className="mt-8 flex items-center gap-2">
                        <input type="checkbox" id={`storage-${index}`} checked={!!variant.attributes.storage} onChange={(e) => updateVariantAttr(index, "storage", e.target.checked)} className="h-4 w-4 accent-amber-700" />
                        <Label htmlFor={`storage-${index}`} className="cursor-pointer text-amber-900">{t("hasStorage")}</Label>
                      </div>
                    </div>
                  )}

                  {watchedType === "sofa" && (
                    <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4 animate-in fade-in">
                      <div className="space-y-2">
                        <Label className="text-orange-900">{t("fabricType")}</Label>
                        <Input placeholder={t("fabricType")} value={variant.attributes.fabricType || ""} onChange={(e) => updateVariantAttr(index, "fabricType", e.target.value)} className="border-orange-200 focus-visible:ring-orange-400" />
                      </div>
                    </div>
                  )}

                  {/* Price & Stock & Images */}
                  <div className="grid grid-cols-3 gap-4 border-t border-stone-100 pt-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-stone-600">{t("variantPrice")}</Label>
                      <Input type="number" step="0.01" value={variant.price} onChange={(e) => { const newV = [...variants]; newV[index].price = parseFloat(e.target.value); setVariants(newV); }} className="border-stone-300 focus-visible:ring-amber-600" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-stone-600">{t("variantStock")}</Label>
                      <Input type="number" value={variant.stock} onChange={(e) => { const newV = [...variants]; newV[index].stock = parseInt(e.target.value); setVariants(newV); }} className="border-stone-300 focus-visible:ring-amber-600" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-stone-600">{t("variantImages")}</Label>
                      <ImageUpload value={variant.images} onChange={(url) => { const newV = [...variants]; newV[index].images = [...newV[index].images, url]; setVariants(newV); }} onRemove={(url) => { const newV = [...variants]; newV[index].images = variant.images.filter(i => i !== url); setVariants(newV); }} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="space-y-6">

          {/* Category + Type + Slug */}
          <Card className="border-stone-200 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-stone-900">
                <Tag size={18} className="text-amber-700" /> {t("category")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-stone-700">{t("category")} <span className="text-red-500">*</span></Label>
                <Select value={watchedCategoryId} onValueChange={(val) => setValue("categoryId", val, { shouldValidate: true })}>
                  <SelectTrigger className="border-stone-300 focus:ring-amber-600"><SelectValue placeholder={t("selectCategory")} /></SelectTrigger>
                  <SelectContent>{categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name?.en || c.name?.tr || t("category")}</SelectItem>))}</SelectContent>
                </Select>
                {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-stone-700">{t("productType")}</Label>
                <Select value={watchedType} onValueChange={(val) => setValue("type", val)}>
                  <SelectTrigger className="border-stone-300 focus:ring-amber-600"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRODUCT_TYPES).map(([key, conf]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2"><conf.icon size={16} /> {t(conf.labelKey)}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-stone-500">{t("productTypeHint")}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-stone-700">{t("slug")}</Label>
                <Input {...register("slug")} className="border-stone-300 focus-visible:ring-amber-600" />
                {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Stock */}
          <Card className="border-stone-200 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-stone-900">
                <Tag size={18} className="text-amber-700" /> {t("pricingStock")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-stone-700">{t("basePrice")}</Label>
                <Input type="number" step="0.01" {...register("price", { valueAsNumber: true })} className="border-stone-300 focus-visible:ring-amber-600" />
              </div>
              <div className="space-y-2">
                <Label className="text-stone-700">{t("totalStock")}</Label>
                <Input type="number" {...register("stock", { valueAsNumber: true })} className="border-stone-300 focus-visible:ring-amber-600" />
              </div>
            </CardContent>
          </Card>

          {/* Dimensions */}
          <Card className="border-stone-200 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-stone-900">
                <Ruler size={18} className="text-amber-700" /> {t("baseDimensions")}
              </CardTitle>
              <CardDescription className="text-stone-500">{t("dimensions")}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              <div className="space-y-1"><Label className="text-xs text-stone-500">W</Label><Input placeholder="W" type="number" {...register("width")} className="border-stone-300 focus-visible:ring-amber-600" /></div>
              <div className="space-y-1"><Label className="text-xs text-stone-500">H</Label><Input placeholder="H" type="number" {...register("height")} className="border-stone-300 focus-visible:ring-amber-600" /></div>
              <div className="space-y-1"><Label className="text-xs text-stone-500">D</Label><Input placeholder="D" type="number" {...register("depth")} className="border-stone-300 focus-visible:ring-amber-600" /></div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card className="border-stone-200 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-stone-900">
                <ImageIcon size={18} className="text-amber-700" /> {t("media")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-stone-700">{t("baseImages")}</Label>
                <ImageUpload value={watchedImages} onChange={(url) => setValue("images", [...watchedImages, url])} onRemove={(url) => setValue("images", watchedImages.filter((i) => i !== url))} />
              </div>
              <div className="space-y-2">
                <Label className="text-stone-700">{t("3dModel")}</Label>
                <p className="text-xs text-stone-500">{t("upload3dDesc")}</p>
                <FileUpload value={watchedModelUrl} onChange={(url) => setValue("modelUrl", url)} onRemove={() => setValue("modelUrl", "")} />
              </div>
              <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <Label className="flex items-center gap-2 text-amber-800"><Wand2 size={16} /> {t("aiMask")}</Label>
                <ImageUpload value={watchedMaskImage ? [watchedMaskImage] : []} onChange={(url) => setValue("maskImage", url)} onRemove={() => setValue("maskImage", "")} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}