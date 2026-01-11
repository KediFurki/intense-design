"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart, Ban } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { MouseEventHandler } from "react";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  data: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image?: string;
    categoryName?: string;
  };
  stock: number;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  text?: string;
}

export default function AddToCartButton({ 
  data, 
  stock,
  className, 
  size = "default", 
  showIcon = true,
  text = "Add to Cart" 
}: AddToCartButtonProps) {
  const cart = useCart();
  const isOutOfStock = stock <= 0;

  const onAddToCart: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    event.preventDefault();

    if (isOutOfStock) return;

    cart.addItem({
      id: data.id,
      name: data.name,
      slug: data.slug,
      price: data.price,
      image: data.image || "",
      categoryName: data.categoryName || "",
      quantity: 1,
      maxStock: stock 
    });
  };

  return (
    <Button 
      onClick={onAddToCart}
      size={size}
      disabled={isOutOfStock}
      className={cn(
        "rounded-full font-bold transition-all duration-200 shadow-sm",
        isOutOfStock 
          ? "bg-slate-200 text-slate-500 cursor-not-allowed hover:bg-slate-200" 
          : "active:scale-95 cursor-pointer hover:shadow-md",
        className
      )}
    >
      {showIcon && (isOutOfStock ? <Ban className="mr-2 h-4 w-4" /> : <ShoppingCart className="mr-2 h-4 w-4" />)}
      {isOutOfStock ? "Sold Out" : text}
    </Button>
  );
}