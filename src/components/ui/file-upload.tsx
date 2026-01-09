"use client";

import { Button } from "@/components/ui/button";
import { FileBox, Trash } from "lucide-react";
import { CldUploadWidget, CloudinaryUploadWidgetResults } from "next-cloudinary";

interface FileUploadProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  onRemove: (value: string) => void;
  value: string; // Tek bir dosya URL'i
}

export default function FileUpload({
  disabled,
  onChange,
  onRemove,
  value,
}: FileUploadProps) {
  
  const onUpload = (result: CloudinaryUploadWidgetResults) => {
    const info = result.info as { secure_url: string };
    if (info?.secure_url) {
      onChange(info.secure_url);
    }
  };

  return (
    <div className="space-y-4">
      {/* Yüklenen Dosyanın Önizlemesi (İkon olarak) */}
      {value && (
        <div className="flex items-center gap-4 p-4 border rounded-md bg-slate-50">
           <FileBox className="h-10 w-10 text-blue-500" />
           <div className="flex-1 overflow-hidden">
             <p className="text-sm font-medium truncate">{value}</p>
             <p className="text-xs text-green-600 font-bold">3D Model Ready</p>
           </div>
           <Button
              type="button"
              onClick={() => onRemove(value)}
              variant="destructive"
              size="sm"
            >
              <Trash className="h-4 w-4" />
            </Button>
        </div>
      )}

      {/* Yükleme Butonu */}
      <CldUploadWidget 
        onSuccess={onUpload} 
        uploadPreset="mobilya_preset" 
        options={{
            maxFiles: 1,
            resourceType: "raw", // <-- DİKKAT: .glb dosyaları için 'raw' veya 'auto' gerekir
            clientAllowedFormats: ["glb", "gltf"], // Sadece 3D formatlarına izin ver
            styles: {
                // ... aynı stiller ...
                palette: {
                    window: "#FFFFFF",
                    windowBorder: "#90A0B3",
                    tabIcon: "#0078FF",
                    menuIcons: "#5A616A",
                    textDark: "#000000",
                    textLight: "#FFFFFF",
                    link: "#0078FF",
                    action: "#FF620C",
                    inactiveTabIcon: "#0E2F5A",
                    error: "#F44235",
                    inProgress: "#0078FF",
                    complete: "#20B832",
                    sourceBg: "#E4EBF1"
                }
            }
        }}
      >
        {({ open }) => {
          return (
            <Button
              type="button"
              disabled={disabled}
              variant="secondary"
              onClick={() => open()}
              className="w-full bg-slate-100 border-dashed border-2 hover:bg-slate-200"
            >
              <FileBox className="h-4 w-4 mr-2" />
              Upload 3D Model (.glb)
            </Button>
          );
        }}
      </CldUploadWidget>
    </div>
  );
}