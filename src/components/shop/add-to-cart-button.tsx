"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
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
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  text?: string;
}

export default function AddToCartButton({ 
  data, 
  className, 
  size = "default", 
  showIcon = true,
  text = "Add to Cart" 
}: AddToCartButtonProps) {
  const cart = useCart();

  const onAddToCart: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    event.preventDefault();

    cart.addItem({
      id: data.id,
      name: data.name,
      slug: data.slug,
      price: data.price,
      image: data.image || "",
      categoryName: data.categoryName || "",
      quantity: 1
    });
  };

  return (
    <Button 
      onClick={onAddToCart}
      size={size}
      className={cn(
        "rounded-full font-bold transition-all duration-200 active:scale-95 cursor-pointer shadow-sm hover:shadow-md",
        className
      )}
    >
      {showIcon && <ShoppingCart className="mr-2 h-4 w-4" />}
      {text}
    </Button>
  );
}