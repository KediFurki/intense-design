"use client";

import { deleteCategory } from "@/server/actions/category";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { CategoryForm } from "./category-form";

type Category = {
  id: string;
  name: unknown; // JSON verisi için unknown
  slug: string;
  description: unknown; // JSON verisi için unknown
  image: string | null;
  createdAt: Date | null;
};

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  // Yardımcı Fonksiyon: JSON verisinden doğru dili çek
  const getLocalized = (data: unknown) => {
    if (!data) return "N/A";
    if (typeof data === "string") return data;
    
    const obj = data as Record<string, string>;
    return obj[locale] || obj["en"] || Object.values(obj)[0] || "N/A";
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingCategory(null);
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this category?")) return;
    const res = await deleteCategory(id);
    if(res.success) toast.success("Category deleted");
    else toast.error("Failed to delete");
  };

  return (
    <div className="grid gap-8 md:grid-cols-3">
      {/* FORM: Key prop'u ile re-render zorlanıyor, böylece state sıfırlanıyor */}
      <div className="md:col-span-1">
         <CategoryForm 
            key={editingCategory ? editingCategory.id : "new"}
            initialData={editingCategory} 
            onSuccess={handleCancel} 
         />
      </div>

      <Card className="md:col-span-2 border-slate-200 shadow-sm h-fit">
        <CardHeader><CardTitle>{t('existingCategories')}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">{t('image')}</TableHead>
                <TableHead>{t('name')} ({locale.toUpperCase()})</TableHead>
                <TableHead>{t('slug')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">{t('noCategories')}</TableCell></TableRow>
              ) : (
                categories.map((cat) => (
                  <TableRow key={cat.id} className={editingCategory?.id === cat.id ? "bg-blue-50" : ""}>
                    <TableCell>
                        {cat.image ? (
                            <div className="relative w-10 h-10 rounded-md overflow-hidden border"><Image src={cat.image} alt="Cat" fill className="object-cover" /></div>
                        ) : (<div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center text-xs text-slate-400">N/A</div>)}
                    </TableCell>
                    <TableCell className="font-medium">{getLocalized(cat.name)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{cat.slug}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)} className="h-8 w-8 hover:bg-blue-100 text-blue-600 cursor-pointer"><Pencil size={16} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="h-8 w-8 text-red-500 hover:bg-red-50 cursor-pointer"><Trash2 size={16} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}