"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; 
import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "./add-to-cart-button";
import { FavoriteButton } from "./favorite-button";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  description: string | null; // <-- EKLENDİ
  price: number;
  stock: number;
  categoryName: string | null;
  imageUrl: string | null;
  isFavorited?: boolean;
}

export function ProductCard({ id, name, slug, description, price, stock, categoryName, imageUrl, isFavorited = false }: ProductCardProps) {
  return (
    <Card className="overflow-hidden group h-full flex flex-col border-none shadow-md hover:shadow-xl transition-all duration-300 relative">
      
      <Link href={`/product/${slug}`} className="block relative aspect-square overflow-hidden bg-slate-100 cursor-pointer">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">No Image</div>
        )}
        
        <div className="absolute top-2 right-2 z-20">
           <FavoriteButton productId={id} initialIsFavorited={isFavorited} />
        </div>

        {stock > 0 && stock < 5 && (
             <div className="absolute top-2 left-2 z-10">
                <Badge variant="destructive" className="shadow-sm">Only {stock} left!</Badge>
             </div>
        )}

        {categoryName && (
          <div className="absolute bottom-2 left-2 z-10">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur text-slate-900 shadow-sm">{categoryName}</Badge>
          </div>
        )}
      </Link>

      <CardContent className="p-4 flex-1">
        <Link href={`/product/${slug}`} className="hover:text-blue-600 transition-colors">
            <h3 className="font-semibold text-lg text-slate-900 leading-tight mb-1">{name}</h3>
        </Link>
        {/* DİNAMİK AÇIKLAMA (Maksimum 2 satır gösterir) */}
        <p className="text-sm text-slate-500 line-clamp-2 min-h-[2.5rem]">
            {description || "No description available."}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="text-xl font-bold text-slate-900">€{(price / 100).toFixed(2)}</div>
        <AddToCartButton 
          size="sm"
          text="Add"
          stock={stock} 
          data={{ id, name, slug, price, categoryName: categoryName || "", image: imageUrl || "" }}
        />
      </CardFooter>
    </Card>
  );
}