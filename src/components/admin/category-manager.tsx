"use client";

import { createCategory, updateCategory, deleteCategory } from "@/server/actions/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ImageUpload from "@/components/ui/image-upload";
import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  createdAt: Date | null;
};

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setImage(cat.image || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setImage("");
  };

  const handleSubmit = async (formData: FormData) => {
    if (image) formData.set("image", image);
    let result;
    if (editingId) {
      result = await updateCategory(editingId, formData);
    } else {
      result = await createCategory(formData);
    }

    if (result.success) {
      toast.success(editingId ? "Category updated!" : "Category created!");
      handleCancel();
    } else {
      toast.error(result.error || "Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this category?")) return;
    const res = await deleteCategory(id);
    if(res.success) toast.success("Category deleted");
    else toast.error("Failed to delete");
  };

  return (
    <div className="grid gap-8 md:grid-cols-3">
      {/* FORM KISMI */}
      <Card className="md:col-span-1 h-fit border-slate-200 shadow-sm sticky top-4">
        <CardHeader>
            <CardTitle>{editingId ? "Edit Category" : "Add New Category"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Category Image</Label>
                <div className="p-2 border rounded-lg bg-slate-50">
                    <ImageUpload 
                        value={image ? [image] : []} 
                        onChange={(url) => setImage(url)} 
                        onRemove={() => setImage("")} 
                    />
                </div>
                <input type="hidden" name="image" value={image} />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input name="name" value={name} onChange={e => setName(e.target.value)} placeholder="Living Room" required />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input name="slug" value={slug} onChange={e => setSlug(e.target.value)} placeholder="living-room" required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea name="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description..." />
            </div>
            <div className="flex gap-2">
                <Button type="submit" className="flex-1 gap-2 bg-slate-900 hover:bg-slate-800 cursor-pointer">
                    {editingId ? <Save size={16}/> : <Plus size={16}/>}
                    {editingId ? "Update" : "Create"}
                </Button>
                {editingId && (
                    <Button type="button" variant="outline" onClick={handleCancel} className="px-3 cursor-pointer">
                        <X size={16} />
                    </Button>
                )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* LİSTE KISMI */}
      <Card className="md:col-span-2 border-slate-200 shadow-sm">
        <CardHeader><CardTitle>Existing Categories</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No categories yet.</TableCell></TableRow>
              ) : (
                categories.map((cat) => (
                  <TableRow key={cat.id} className={editingId === cat.id ? "bg-blue-50" : ""}>
                    <TableCell>
                        {cat.image ? (
                            <div className="relative w-10 h-10 rounded-md overflow-hidden border">
                                <Image src={cat.image} alt={cat.name} fill className="object-cover" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center text-xs text-slate-400">N/A</div>
                        )}
                    </TableCell>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{cat.slug}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)} className="h-8 w-8 hover:bg-blue-100 text-blue-600 cursor-pointer">
                            <Pencil size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="h-8 w-8 text-red-500 hover:bg-red-50 cursor-pointer">
                            <Trash2 size={16} />
                        </Button>
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