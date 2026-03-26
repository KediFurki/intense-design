"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileBox, Trash, Link as LinkIcon, Upload, Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface FileUploadProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  onRemove: (value: string) => void;
  value: string;
  folder?: string;
}

export default function FileUpload({
  disabled,
  onChange,
  onRemove,
  value,
  folder = "models",
}: FileUploadProps) {
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
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile(file);
    e.target.value = "";
  }, [uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "glb" || ext === "gltf") uploadFile(file);
  }, [uploadFile]);

  const isDisabled = disabled || uploading;

  return (
    <div className="space-y-4">
      {/* Uploaded File Preview */}
      {value && (
        <div className="flex items-center gap-4 p-4 border border-stone-200 rounded-xl bg-stone-50">
           <FileBox className="h-10 w-10 text-amber-700" />
           <div className="flex-1 overflow-hidden">
             <p className="text-sm font-medium truncate text-stone-700">{value}</p>
             <p className="text-xs text-emerald-600 font-bold">3D Model Ready</p>
           </div>
           <Button
             type="button"
             onClick={() => onRemove(value)}
             variant="destructive"
             size="sm"
             className="cursor-pointer"
           >
             <Trash className="h-4 w-4" />
           </Button>
        </div>
      )}

      {/* Drag & Drop / File Picker Zone */}
      {!value && (
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
            accept=".glb,.gltf"
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
                3D model sürükleyin veya <span className="text-amber-700 font-medium">tıklayıp seçin</span>
              </p>
              <p className="text-xs text-stone-400">.glb, .gltf — max 50MB</p>
            </>
          )}
        </div>
      )}

      {/* URL Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-stone-400" />
          <Input
            type="url"
            disabled={isDisabled}
            placeholder="https://intensedesign.b-cdn.net/model.glb"
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
          <FileBox className="h-4 w-4 mr-2" />
          Ekle
        </Button>
      </div>
    </div>
  );
}