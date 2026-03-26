"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileBox, Trash, Link as LinkIcon } from "lucide-react";
import { useState } from "react";

interface FileUploadProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  onRemove: (value: string) => void;
  value: string;
}

export default function FileUpload({
  disabled,
  onChange,
  onRemove,
  value,
}: FileUploadProps) {
  const [urlInput, setUrlInput] = useState("");

  const handleAdd = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setUrlInput("");
  };

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

      {/* URL Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-stone-400" />
          <Input
            type="url"
            disabled={disabled}
            placeholder="https://cdn.example.com/model.glb"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
            className="pl-9 border-stone-300"
          />
        </div>
        <Button
          type="button"
          disabled={disabled || !urlInput.trim()}
          variant="secondary"
          onClick={handleAdd}
          className="bg-stone-100 border-stone-300 border border-dashed hover:bg-stone-200 cursor-pointer shrink-0"
        >
          <FileBox className="h-4 w-4 mr-2" />
          Add .glb
        </Button>
      </div>
    </div>
  );
}