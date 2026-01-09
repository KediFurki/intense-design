import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Bunu birazdan indireceğiz
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  categoryName: string | null;
  imageUrl: string | null;
}

export function ProductCard({ name, slug, price, categoryName, imageUrl }: ProductCardProps) {
  return (
    <Card className="overflow-hidden group h-full flex flex-col border-none shadow-md hover:shadow-xl transition-all duration-300">
      
      {/* Resim Alanı */}
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            No Image
          </div>
        )}
        
        {/* Kategori Etiketi */}
        {categoryName && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur text-slate-900">
              {categoryName}
            </Badge>
          </div>
        )}
      </div>

      {/* İçerik */}
      <CardContent className="p-4 flex-1">
        <Link href={`/product/${slug}`} className="hover:underline">
            <h3 className="font-semibold text-lg text-slate-900 leading-tight mb-1">
            {name}
            </h3>
        </Link>
        <p className="text-sm text-slate-500 line-clamp-2">
            Luxury furniture for your home.
        </p>
      </CardContent>

      {/* Alt Kısım: Fiyat ve Sepet Butonu */}
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="text-xl font-bold text-slate-900">
          €{(price / 100).toFixed(2)}
        </div>
        <Button size="sm" className="rounded-full gap-2">
          <ShoppingCart size={16} />
          Add
        </Button>
      </CardFooter>
    </Card>
  );
}