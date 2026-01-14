import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link"; // <-- DİKKAT: Bunu aşağıda değiştireceğiz
import { Link as I18nLink } from "@/lib/i18n/routing"; // <-- i18n Uyumlu Link
import { LogOut, ChevronDown } from "lucide-react";
import CartSheet from "@/components/shop/cart-sheet";
import { db } from "@/server/db";
import { categories } from "@/server/db/schema";
import LanguageSwitcher from "./language-switcher"; // <-- YENİ BİLEŞEN
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTranslations } from "next-intl/server";

export default async function Header() {
  const session = await auth();
  const categoryList = await db.select().from(categories);
  const t = await getTranslations("Navigation"); // Çevirileri çek

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <div className="flex items-center gap-8">
          <I18nLink href="/" className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-1">
            Instant<span className="text-blue-600">Design</span>
            <span className="w-2 h-2 rounded-full bg-blue-600 mt-3"></span>
          </I18nLink>

          {/* MENÜ */}
          <nav className="hidden md:flex items-center gap-6">
            <I18nLink href="/" className="text-sm font-medium hover:text-blue-600 transition-colors">{t('home')}</I18nLink>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium hover:text-blue-600 outline-none transition-colors group">
                {t('categories')} <ChevronDown size={14} className="group-data-[state=open]:rotate-180 transition-transform" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {categoryList.map((cat) => (
                  <I18nLink key={cat.id} href={`/category/${cat.slug}`}>
                    <DropdownMenuItem className="cursor-pointer">
                      {cat.name}
                    </DropdownMenuItem>
                  </I18nLink>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <I18nLink href="/about" className="text-sm font-medium hover:text-blue-600 transition-colors">{t('about')}</I18nLink>
            <I18nLink href="/contact" className="text-sm font-medium hover:text-blue-600 transition-colors">{t('contact')}</I18nLink>
          </nav>
        </div>

        {/* SAĞ TARAF */}
        <div className="flex items-center gap-2">
          
          {/* DİL SEÇİCİ */}
          <LanguageSwitcher />

          <CartSheet />

          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                   <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                      {session.user.name?.charAt(0).toUpperCase()}
                   </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t('profile')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <I18nLink href="/account"><DropdownMenuItem className="cursor-pointer">{t('profile')}</DropdownMenuItem></I18nLink>
                {session.user.role === "admin" && (
                   <I18nLink href="/admin"><DropdownMenuItem className="cursor-pointer text-blue-600 font-semibold">{t('admin')}</DropdownMenuItem></I18nLink>
                )}
                <DropdownMenuSeparator />
                <form action={async () => { "use server"; await signOut(); }}>
                  <button type="submit" className="w-full text-left">
                    <DropdownMenuItem className="cursor-pointer text-red-600">
                      <LogOut className="mr-2 h-4 w-4" /> {t('logout')}
                    </DropdownMenuItem>
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <I18nLink href="/login">
              <Button>{t('login')}</Button>
            </I18nLink>
          )}
        </div>
      </div>
    </header>
  );
}