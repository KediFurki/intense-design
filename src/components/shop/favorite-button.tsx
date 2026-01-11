"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleFavorite } from "@/server/actions/favorite";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  productId: string;
  initialIsFavorited: boolean;
  className?: string;
}

export function FavoriteButton({ productId, initialIsFavorited, className }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault(); // Link tıklamasını engelle
    e.stopPropagation();

    // Optimistic UI Update (Anında renk değiştir)
    const newState = !isFavorited;
    setIsFavorited(newState);

    startTransition(async () => {
      const result = await toggleFavorite(productId);
      if (!result.success) {
        setIsFavorited(!newState); // Geri al
        toast.error("Please login to add favorites");
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("rounded-full bg-white/80 backdrop-blur hover:bg-white transition-all shadow-sm", className)}
      onClick={handleToggle}
      disabled={isPending}
    >
      <Heart 
        className={cn("transition-colors", isFavorited ? "fill-red-500 text-red-500" : "text-slate-600")} 
        size={20} 
      />
    </Button>
  );
}