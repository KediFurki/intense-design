"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  stock: number;
  text?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  data: {
    id: string;
    variantId?: string;
    variantName?: string; // <-- Bu alan kritik
    name: string;
    slug: string;
    price: number;
    image: string;
    categoryName?: string;
  };
}

export default function AddToCartButton({ stock, text = "Add to Cart", className, size = "default", data }: AddToCartButtonProps) {
  const cart = useCart();

  const onAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); 
    e.stopPropagation();

    cart.addItem({
      id: data.id,
      variantId: data.variantId,
      variantName: data.variantName, // <-- Sepete iletiliyor
      name: data.name,
      slug: data.slug,
      price: data.price,
      image: data.image,
      categoryName: data.categoryName,
      quantity: 1,
      maxStock: stock,
    });
  };

  return (
    <Button
      onClick={onAddToCart}
      disabled={stock <= 0}
      size={size}
      className={cn("cursor-pointer relative overflow-hidden transition-all active:scale-95", className)}
    >
      <ShoppingCart size={18} className={cn(text ? "mr-2" : "")} />
      {stock > 0 ? text : "Out of Stock"}
    </Button>
  );
}