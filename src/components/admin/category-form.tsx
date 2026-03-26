"use client";

import { createCategory, updateCategory } from "@/server/actions/category";
import type { CategoryInput } from "@/server/actions/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUpload from "@/components/ui/image-upload";
import { useEffect } from "react";
import { Plus, Save, X, Globe } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

/* ─── Zod Schema ─── */
const LOCALES = ["en", "tr", "de", "bg"] as const;
type Locale = (typeof LOCALES)[number];

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

const categoryFormSchema = z.object({
  name: localizedNameSchema,
  description: localizedDescSchema,
  slug: z.string().min(2, "Slug is required"),
  image: z.string(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

/* ─── Helpers ─── */
type LocalizedString = Record<Locale, string>;

const emptyLocalized = (): LocalizedString => ({ en: "", tr: "", de: "", bg: "" });

function parseLocalized(val: unknown): LocalizedString {
  if (!val) return emptyLocalized();
  if (typeof val === "string") return { ...emptyLocalized(), en: val };
  const obj = val as Record<string, string>;
  return {
    en: obj.en || "",
    tr: obj.tr || "",
    de: obj.de || "",
    bg: obj.bg || "",
  };
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

const LOCALE_LABELS: Record<Locale, string> = { en: "EN", tr: "TR", de: "DE", bg: "BG" };

/* ─── Types ─── */
type CategoryData = {
  id?: string;
  name: unknown;
  slug: string;
  description: unknown;
  image: string | null;
};

interface CategoryFormProps {
  initialData?: CategoryData | null;
  onSuccess?: () => void;
}

/* ─── Component ─── */
export function CategoryForm({ initialData, onSuccess }: CategoryFormProps) {
  const t = useTranslations("Admin");

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: parseLocalized(initialData?.name),
      description: parseLocalized(initialData?.description),
      slug: initialData?.slug || "",
      image: initialData?.image || "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  // Auto-slug from English name
  const nameEn = watch("name.en");
  useEffect(() => {
    if (!initialData?.id && nameEn) {
      setValue("slug", slugify(nameEn), { shouldValidate: true });
    }
  }, [nameEn, initialData?.id, setValue]);

  const imageValue = watch("image");

  const onSubmit = async (data: CategoryFormValues) => {
    const input: CategoryInput = {
      name: {
        en: data.name.en,
        tr: data.name.tr ?? "",
        de: data.name.de ?? "",
        bg: data.name.bg ?? "",
      },
      description: {
        en: data.description.en ?? "",
        tr: data.description.tr ?? "",
        de: data.description.de ?? "",
        bg: data.description.bg ?? "",
      },
      slug: data.slug,
      image: data.image || undefined,
    };

    let result;
    if (initialData?.id) {
      result = await updateCategory(initialData.id, input);
    } else {
      result = await createCategory(input);
    }

    if (result.success) {
      toast.success(initialData ? "Updated!" : "Created!");
      if (!initialData) form.reset();
      onSuccess?.();
    } else {
      toast.error(result.error || "Failed");
    }
  };

  return (
    <Card className="h-fit border-slate-200 shadow-sm sticky top-4">
      <CardHeader>
        <CardTitle>{initialData ? t("edit") : t("create")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>{t("categoryImage")}</Label>
            <div className="rounded-lg border bg-slate-50 p-2">
              <ImageUpload
                value={imageValue ? [imageValue] : []}
                onChange={(url) => setValue("image", url)}
                onRemove={() => setValue("image", "")}
              />
            </div>
          </div>

          {/* Localized Tabs */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
              <Globe size={12} /> Localization
            </Label>
            <Tabs defaultValue="en" className="w-full">
              <TabsList className="mb-2 grid w-full grid-cols-4">
                {LOCALES.map((loc) => (
                  <TabsTrigger
                    key={loc}
                    value={loc}
                    className="h-7 text-[10px] uppercase"
                  >
                    {LOCALE_LABELS[loc]}
                  </TabsTrigger>
                ))}
              </TabsList>

              {LOCALES.map((loc) => (
                <TabsContent key={loc} value={loc} className="space-y-3">
                  {/* Name */}
                  <div className="space-y-1">
                    <Label className="text-xs">
                      Name ({LOCALE_LABELS[loc]})
                      {loc === "en" && <span className="ml-1 text-red-500">*</span>}
                    </Label>
                    <Input
                      {...register(`name.${loc}` as const)}
                      placeholder={`Category name (${LOCALE_LABELS[loc]})`}
                    />
                    {loc === "en" && errors.name?.en && (
                      <p className="text-xs text-red-500">{errors.name.en.message}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <Label className="text-xs">
                      Description ({LOCALE_LABELS[loc]})
                    </Label>
                    <Textarea
                      {...register(`description.${loc}` as const)}
                      placeholder={`Description (${LOCALE_LABELS[loc]})`}
                      rows={2}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Slug */}
          <div className="space-y-1">
            <Label>{t("slug")}</Label>
            <Input
              {...register("slug")}
              placeholder="url-slug"
            />
            {errors.slug && (
              <p className="text-xs text-red-500">{errors.slug.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 cursor-pointer gap-2 bg-slate-900 hover:bg-slate-800"
            >
              {initialData ? <Save size={16} /> : <Plus size={16} />}
              {isSubmitting
                ? "Saving..."
                : initialData
                  ? t("save")
                  : t("create")}
            </Button>
            {initialData && onSuccess && (
              <Button
                type="button"
                variant="outline"
                onClick={onSuccess}
                className="cursor-pointer px-3"
              >
                <X size={16} />
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}