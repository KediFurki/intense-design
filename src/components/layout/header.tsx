import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogOut, User, ChevronDown } from "lucide-react";
import CartSheet from "@/components/shop/cart-sheet";
import { db } from "@/server/db";
import { categories } from "@/server/db/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default async function Header() {
  const session = await auth();
  
  // Kategorileri sunucudan çekiyoruz (Navigasyon için)
  const categoryList = await db.select().from(categories);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* SOL: LOGO VE MENÜ */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-1">
            Instant<span className="text-blue-600">Design</span>
            <span className="w-2 h-2 rounded-full bg-blue-600 mt-3"></span>
          </Link>

          {/* MASAÜSTÜ MENÜSÜ */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-blue-600 transition-colors">Home</Link>
            
            {/* KATEGORİLER DROPDOWN (HOVER GİBİ ÇALIŞIR) */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium hover:text-blue-600 outline-none transition-colors group">
                Categories <ChevronDown size={14} className="group-data-[state=open]:rotate-180 transition-transform" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {categoryList.map((cat) => (
                  <Link key={cat.id} href={`/category/${cat.slug}`}>
                    <DropdownMenuItem className="cursor-pointer">
                      {cat.name}
                    </DropdownMenuItem>
                  </Link>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/about" className="text-sm font-medium hover:text-blue-600 transition-colors">About</Link>
            <Link href="/contact" className="text-sm font-medium hover:text-blue-600 transition-colors">Contact</Link>
          </nav>
        </div>

        {/* SAĞ: SEPET & KULLANICI */}
        <div className="flex items-center gap-4">
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
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/account"><DropdownMenuItem className="cursor-pointer">Profile & Orders</DropdownMenuItem></Link>
                {session.user.role === "admin" && (
                   <Link href="/admin"><DropdownMenuItem className="cursor-pointer text-blue-600 font-semibold">Admin Panel</DropdownMenuItem></Link>
                )}
                <DropdownMenuSeparator />
                <form action={async () => { "use server"; await signOut(); }}>
                  <button type="submit" className="w-full text-left">
                    <DropdownMenuItem className="cursor-pointer text-red-600">
                      <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </DropdownMenuItem>
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}