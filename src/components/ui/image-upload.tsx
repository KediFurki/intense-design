"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePlus, Trash, Link as LinkIcon, Upload, Loader2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

interface ImageUploadProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  onRemove: (value: string) => void;
  value: string[];
  folder?: string;
}

export default function ImageUpload({
  disabled,
  onChange,
  onRemove,
  value,
  folder = "images",
}: ImageUploadProps) {
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setUrlInput("");
  };

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  }, [folder, onChange]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    Array.from(files).forEach(uploadFile);
    e.target.value = "";
  }, [uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (!files?.length) return;
    Array.from(files).forEach((f) => {
      if (f.type.startsWith("image/")) uploadFile(f);
    });
  }, [uploadFile]);

  const isDisabled = disabled || uploading;

  return (
    <div className="space-y-4">
      {/* Uploaded Image Previews */}
      <div className="flex items-center gap-4 flex-wrap">
        {value.map((url) => (
          <div key={url} className="relative w-[200px] h-[200px] rounded-xl overflow-hidden border border-stone-200">
            <div className="z-10 absolute top-2 right-2">
              <Button
                type="button"
                onClick={() => onRemove(url)}
                variant="destructive"
                size="icon"
                className="h-8 w-8 cursor-pointer"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
            <Image fill className="object-cover" alt="Image" src={url} />
          </div>
        ))}
      </div>

      {/* Drag & Drop / File Picker Zone */}
      <div
        className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors cursor-pointer ${
          dragOver
            ? "border-amber-500 bg-amber-50"
            : "border-stone-300 bg-stone-50 hover:border-stone-400 hover:bg-stone-100"
        }`}
        onClick={() => !isDisabled && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={isDisabled}
          onChange={handleFileSelect}
          className="hidden"
        />
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
            <p className="text-sm text-stone-500">Yükleniyor...</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-stone-400" />
            <p className="text-sm text-stone-500">
              Resim sürükleyin veya <span className="text-amber-700 font-medium">tıklayıp seçin</span>
            </p>
            <p className="text-xs text-stone-400">JPG, PNG, WebP, AVIF — max 10MB</p>
          </>
        )}
      </div>

      {/* URL Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-stone-400" />
          <Input
            type="url"
            disabled={isDisabled}
            placeholder="https://intensedesign.b-cdn.net/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddUrl(); } }}
            className="pl-9 border-stone-300"
          />
        </div>
        <Button
          type="button"
          disabled={isDisabled || !urlInput.trim()}
          variant="secondary"
          onClick={handleAddUrl}
          className="bg-stone-100 border-stone-300 border border-dashed hover:bg-stone-200 cursor-pointer shrink-0"
        >
          <ImagePlus className="h-4 w-4 mr-2" />
          Ekle
        </Button>
      </div>
    </div>
  );
}