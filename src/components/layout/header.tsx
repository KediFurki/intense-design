import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogOut } from "lucide-react"; // User ve Menu silindi
import CartSheet from "@/components/shop/cart-sheet";

export default async function Header() {
  const session = await auth();

  return (
    // Tailwind v4 düzeltmesi: supports-backdrop-filter
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        <Link href="/" className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-1">
          Instant<span className="text-blue-600">Design</span>
          <span className="w-2 h-2 rounded-full bg-blue-600 mt-3"></span>
        </Link>

        <div className="flex items-center gap-4">
          <CartSheet />

          {session?.user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              {session.user.role === "admin" && (
                 <Link href="/admin" className="hidden md:block">
                   <Button variant="ghost" size="sm">Admin</Button>
                 </Link>
              )}
              
              <div className="flex items-center gap-2">
                 {/* Tailwind v4 düzeltmesi: bg-linear-to-tr */}
                 <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                    {session.user.name?.charAt(0).toUpperCase()}
                 </div>
              </div>

              <form action={async () => { "use server"; await signOut(); }}>
                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-red-600" title="Sign Out">
                  <LogOut size={18} />
                </Button>
              </form>
            </div>
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