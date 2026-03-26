"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePlus, Trash, Link as LinkIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ImageUploadProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  onRemove: (value: string) => void;
  value: string[];
}

export default function ImageUpload({
  disabled,
  onChange,
  onRemove,
  value,
}: ImageUploadProps) {
  const [urlInput, setUrlInput] = useState("");

  const handleAdd = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setUrlInput("");
  };

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

      {/* URL Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-stone-400" />
          <Input
            type="url"
            disabled={disabled}
            placeholder="https://cdn.example.com/image.jpg"
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
          <ImagePlus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>
    </div>
  );
}