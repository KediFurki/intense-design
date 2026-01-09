"use client";

import { createProduct, updateProduct, State } from "@/server/actions/products";
import { useActionState, useState } from "react"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import ImageUpload from "@/components/ui/image-upload";
import FileUpload from "@/components/ui/file-upload";

interface ProductFormProps {
  categories: { id: string; name: string }[];
  initialData?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    stock: number | null;
    categoryId: string | null;
    width: number | null;
    height: number | null;
    depth: number | null;
    images: string[] | null;
    modelUrl: string | null;
  };
}

export function ProductForm({ categories, initialData }: ProductFormProps) {
  const initialState: State = { message: null, errors: {} };
  const updateActionWithId = initialData 
    ? updateProduct.bind(null, initialData.id) 
    : createProduct;

  const [state, formAction] = useActionState(updateActionWithId, initialState);
  
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [modelUrl, setModelUrl] = useState<string>(initialData?.modelUrl || "");

  return (
    <form action={formAction} className="space-y-8">
      
      {state.message && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {state.message}
        </div>
      )}

      {/* GÖRSEL YÜKLEME */}
      <div className="space-y-4">
         <Label className="text-lg font-semibold">Product Images</Label>
         <p className="text-sm text-muted-foreground">Upload high quality images.</p>
         
         {images.length > 0 ? (
            <input type="hidden" name="imageUrl" value={images[0]} />
         ) : null}

         <ImageUpload 
            value={images}
            onChange={(url) => setImages([url])}
            onRemove={(url) => setImages(images.filter((current) => current !== url))}
         />
      </div>

      {/* 3D MODEL YÜKLEME */}
      <div className="space-y-4 bg-blue-50/50 p-6 rounded-lg border border-blue-100">
         <Label className="text-lg font-semibold text-blue-900">3D Model (AR)</Label>
         <p className="text-sm text-slate-500">
            Upload a <b>.glb</b> file to enable Augmented Reality.
         </p>
         
         <input type="hidden" name="modelUrl" value={modelUrl} />

         <FileUpload 
            value={modelUrl}
            onChange={(url) => setModelUrl(url)}
            onRemove={() => setModelUrl("")}
         />
      </div>

      {/* FORM ALANLARI */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Product Name</Label>
          <Input name="name" defaultValue={initialData?.name || ""} required />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input name="slug" defaultValue={initialData?.slug || ""} required />
        </div>
      </div>

      <div className="space-y-2">
          <Label>Category</Label>
          <Select name="categoryId" defaultValue={initialData?.categoryId || undefined}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Price (€)</Label>
          <Input name="price" type="number" step="0.01" defaultValue={initialData ? initialData.price / 100 : ""} required />
        </div>
        <div className="space-y-2">
          <Label>Stock</Label>
          <Input name="stock" type="number" defaultValue={initialData?.stock || 1} required />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 bg-slate-50 p-6 rounded-lg border">
          <div className="col-span-3 text-sm font-semibold text-slate-500">Dimensions (mm)</div>
          <div className="space-y-2"><Label>Width</Label><Input name="width" type="number" defaultValue={initialData?.width || ""} /></div>
          <div className="space-y-2"><Label>Height</Label><Input name="height" type="number" defaultValue={initialData?.height || ""} /></div>
          <div className="space-y-2"><Label>Depth</Label><Input name="depth" type="number" defaultValue={initialData?.depth || ""} /></div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea name="description" defaultValue={initialData?.description || ""} className="min-h-[150px]" required />
      </div>

      <div className="flex gap-4 pt-4">
          <Link href="/admin/products" className="w-full">
              <Button variant="outline" className="w-full" type="button">Cancel</Button>
          </Link>
          <Button type="submit" className="w-full text-lg py-6">{initialData ? "Save Changes" : "Create Product"}</Button>
      </div>
    </form>
  );
}