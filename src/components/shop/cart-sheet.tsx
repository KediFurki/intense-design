"use client";

import { ShoppingBag, Trash2, ArrowRight, Minus, Plus } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "@/lib/i18n/routing";
import { useTranslations } from "next-intl";

export default function CartSheet() {
  const t = useTranslations("Cart");
  const [isMounted, setIsMounted] = useState(false);
  const cart = useCart();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const totalPrice = cart.items.reduce((total, item) => total + (Number(item.price) * item.quantity), 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-full border-[#eadfce] bg-white/75 text-[#6f4e37] shadow-sm transition-colors hover:bg-[#fff4e8] hover:text-[#9a5f2f] cursor-pointer active:scale-95">
          <ShoppingBag size={19} />
          {cart.items.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#9a5f2f] text-[10px] font-bold text-white animate-in zoom-in">
              {cart.items.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="flex flex-col w-full sm:max-w-lg bg-white/95 backdrop-blur-xl">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            {t('title')} <span className="text-blue-600">({cart.items.length})</span>
          </SheetTitle>
        </SheetHeader>

        {cart.items.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-lg font-medium text-slate-900">{t('empty')}</p>
            <p className="text-sm text-slate-500 max-w-xs">{t('emptyDesc')}</p>
          </div>
        )}

        {cart.items.length > 0 && (
          <>
            <ScrollArea className="flex-1 pr-4 -mr-4">
              <ul className="space-y-4 py-6">
                <AnimatePresence mode="popLayout">
                  {cart.items.map((item) => (
                    <motion.li
                      key={`${item.id}-${item.variantId}`}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                      className="flex gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100 group"
                    >
                      <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-white border shrink-0">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-slate-100 text-xs text-slate-400">{t('noImage')}</div>
                        )}
                      </div>
                      
                      <div className="flex flex-1 flex-col justify-between py-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-slate-900 line-clamp-1">{item.name}</h4>
                                {item.variantName && (
                                  <p className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                                    {item.variantName}
                                  </p>
                                )}
                                <p className="text-xs text-slate-500 mt-0.5">{item.categoryName || "Furniture"}</p>
                            </div>
                            <button 
                                onClick={() => cart.removeItem(item.id, item.variantId)}
                                className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                           <p className="font-bold text-slate-900">€{(item.price / 100).toFixed(2)}</p>
                           <div className="flex items-center gap-2 bg-white rounded-md border px-2 py-1 shadow-sm">
                              <button onClick={() => cart.decreaseItem(item.id, item.variantId)} className="text-slate-500 hover:text-slate-900 cursor-pointer active:scale-75 transition-transform"><Minus size={14}/></button>
                              <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                              <button onClick={() => cart.addItem(item)} className="text-slate-500 hover:text-slate-900 cursor-pointer active:scale-75 transition-transform"><Plus size={14}/></button>
                           </div>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </ScrollArea>

            <div className="border-t pt-6 space-y-4 bg-white mt-auto">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>{t('total')}</span>
                <span>€{(totalPrice / 100).toFixed(2)}</span>
              </div>
              <SheetTrigger asChild>
                <Link href="/checkout">
                  <Button className="w-full h-12 text-lg rounded-xl gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-transform cursor-pointer" size="lg">
                    {t('checkout')} <ArrowRight size={18} />
                  </Button>
                </Link>
              </SheetTrigger>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}