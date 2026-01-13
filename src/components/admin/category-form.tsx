"use client";

import { createCategory, updateCategory } from "@/server/actions/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUpload from "@/components/ui/image-upload";
import { useState } from "react";
import { Plus, Save, X, Globe } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const LOCALES = ["en", "tr", "de", "bg"] as const;
type Locale = typeof LOCALES[number];
type LocalizedString = Record<Locale, string>;

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

export function CategoryForm({ initialData, onSuccess }: CategoryFormProps) {
  const t = useTranslations("Admin");
  const [loading, setLoading] = useState(false);

  const parseLocalized = (val: unknown): LocalizedString => {
    if (!val) return { en: "", tr: "", de: "", bg: "" };
    if (typeof val === "string") return { en: val, tr: "", de: "", bg: "" };
    const obj = val as Record<string, string>;
    return { en: obj.en || "", tr: obj.tr || "", de: obj.de || "", bg: obj.bg || "" };
  };

  const [names, setNames] = useState<LocalizedString>(parseLocalized(initialData?.name));
  const [descriptions, setDescriptions] = useState<LocalizedString>(parseLocalized(initialData?.description));
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [image, setImage] = useState(initialData?.image || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("names", JSON.stringify(names));
    formData.append("descriptions", JSON.stringify(descriptions));
    formData.append("slug", slug);
    if (image) formData.append("image", image);
    formData.append("name", names.en || "Category"); 

    let result;
    if (initialData?.id) {
      result = await updateCategory(initialData.id, formData);
    } else {
      result = await createCategory(formData);
    }

    if (result.success) {
      toast.success(initialData ? "Updated!" : "Created!");
      if (onSuccess) onSuccess();
    } else {
      toast.error(result.error || "Failed");
    }
    setLoading(false);
  };

  return (
    <Card className="h-fit border-slate-200 shadow-sm sticky top-4">
        <CardHeader>
            <CardTitle>{initialData ? t('edit') : t('create')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
                <Label>{t('categoryImage')}</Label>
                <div className="p-2 border rounded-lg bg-slate-50">
                    <ImageUpload value={image ? [image] : []} onChange={(url) => setImage(url)} onRemove={() => setImage("")} />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs uppercase text-muted-foreground"><Globe size={12}/> Localization</Label>
                <Tabs defaultValue="en" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-2">
                        {LOCALES.map(loc => (<TabsTrigger key={loc} value={loc} className="uppercase text-[10px] h-7">{loc}</TabsTrigger>))}
                    </TabsList>
                    {LOCALES.map(loc => (
                        <TabsContent key={loc} value={loc} className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Name ({loc})</Label>
                                <Input value={names[loc]} onChange={(e) => setNames({...names, [loc]: e.target.value})} placeholder="Name" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Desc ({loc})</Label>
                                <Textarea value={descriptions[loc]} onChange={(e) => setDescriptions({...descriptions, [loc]: e.target.value})} rows={2} />
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>

            <div className="space-y-2"><Label>{t('slug')}</Label><Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="url-slug" required /></div>

            <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={loading} className="flex-1 gap-2 bg-slate-900 hover:bg-slate-800 cursor-pointer">
                    {initialData ? <Save size={16}/> : <Plus size={16}/>}
                    {loading ? "Saving..." : (initialData ? t('save') : t('create'))}
                </Button>
                {initialData && onSuccess && <Button type="button" variant="outline" onClick={onSuccess} className="px-3 cursor-pointer"><X size={16} /></Button>}
            </div>
          </form>
        </CardContent>
      </Card>
  );
}