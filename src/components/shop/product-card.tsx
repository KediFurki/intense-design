"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; 
import Image from "next/image";
import Link from "next/link";
// YENİ BUTONU KULLAN
import AddToCartButton from "./add-to-cart-button";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  categoryName: string | null;
  imageUrl: string | null;
}

export function ProductCard({ id, name, slug, price, categoryName, imageUrl }: ProductCardProps) {
  return (
    <Card className="overflow-hidden group h-full flex flex-col border-none shadow-md hover:shadow-xl transition-all duration-300">
      
      <Link href={`/product/${slug}`} className="block relative aspect-square overflow-hidden bg-slate-100 cursor-pointer">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            No Image
          </div>
        )}
        
        {categoryName && (
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur text-slate-900 shadow-sm">
              {categoryName}
            </Badge>
          </div>
        )}
      </Link>

      <CardContent className="p-4 flex-1">
        <Link href={`/product/${slug}`} className="hover:text-blue-600 transition-colors">
            <h3 className="font-semibold text-lg text-slate-900 leading-tight mb-1">
            {name}
            </h3>
        </Link>
        <p className="text-sm text-slate-500 line-clamp-2">
            Luxury furniture for your home.
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="text-xl font-bold text-slate-900">
          €{(price / 100).toFixed(2)}
        </div>
        {/* YENİ BUTON BİLEŞENİ */}
        <AddToCartButton 
          size="sm"
          text="Add"
          data={{ id, name, slug, price, categoryName: categoryName || "", image: imageUrl || "" }}
        />
      </CardFooter>
    </Card>
  );
}