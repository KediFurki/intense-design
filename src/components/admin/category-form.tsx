"use client";

import { createCategory } from "@/server/actions/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ImageUpload from "@/components/ui/image-upload";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function CategoryForm() {
  const [image, setImage] = useState("");

  const handleSubmit = async (formData: FormData) => {
    if (image) formData.set("image", image);
    
    const result = await createCategory(formData);

    if (result.success) {
      toast.success("Category created successfully!");
      setImage("");
      const form = document.getElementById("category-form") as HTMLFormElement;
      if(form) form.reset();
    } else {
      toast.error(result.error || "Failed to create category");
    }
  };

  return (
    <Card className="h-fit border-slate-200 shadow-sm">
        <CardHeader><CardTitle>Add New Category</CardTitle></CardHeader>
        <CardContent>
          <form id="category-form" action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Category Image</Label>
                <div className="p-2 border rounded-lg bg-slate-50">
                    <ImageUpload 
                        value={image ? [image] : []} 
                        onChange={(url) => setImage(url)} 
                        onRemove={() => setImage("")} 
                    />
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Living Room" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input id="slug" name="slug" placeholder="living-room" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Optional description..." />
            </div>
            <Button type="submit" className="w-full gap-2 cursor-pointer bg-slate-900 hover:bg-slate-800">
                <Plus size={16}/> Create Category
            </Button>
          </form>
        </CardContent>
      </Card>
  );
}