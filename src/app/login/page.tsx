import { auth, signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Facebook, Chrome } from "lucide-react"; // Chrome ikonunu Google niyetine kullanacağız
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function LoginPage() {
  const session = await auth();

  // Eğer kullanıcı zaten giriş yapmışsa ana sayfaya at
  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2">
      {/* SOL TARAFTAKİ LOGIN FORMU */}
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-balance text-muted-foreground">
              Login to manage your premium furniture orders.
            </p>
          </div>
          
          <Card className="border-none shadow-none">
            <CardContent className="grid gap-4 p-0">
              {/* GOOGLE LOGIN BUTTON (SERVER ACTION) */}
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/" });
                }}
              >
                <Button variant="outline" type="submit" className="w-full gap-2">
                  <Chrome className="h-4 w-4" /> {/* Lucide'de Google ikonu olmadığı için Chrome kullanıyoruz */}
                  Sign in with Google
                </Button>
              </form>

              {/* FACEBOOK LOGIN BUTTON */}
              <form
                action={async () => {
                  "use server";
                  await signIn("facebook", { redirectTo: "/" });
                }}
              >
                <Button variant="outline" type="submit" className="w-full gap-2 bg-[#1877F2] text-white hover:bg-[#1877F2]/90 hover:text-white">
                  <Facebook className="h-4 w-4" />
                  Sign in with Facebook
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>

              {/* EMAIL LOGIN (Görsel amaçlı şimdilik, backend'i sonra bağlarız) */}
              <div className="grid gap-2">
                <Button disabled variant="secondary">
                   Email Login (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SAĞ TARAFTAKİ GÖRSEL ALAN (PREMIUM HİSSİYAT) */}
      <div className="hidden bg-muted lg:block relative h-full w-full">
         {/* Buraya geçici olarak placeholder bir resim koyuyoruz.
             İleride buraya senin render aldığın 3D mutfak görselini koyacağız. */}
         <div className="absolute inset-0 bg-zinc-900/20 z-10" /> {/* Karartma perdesi */}
         <img
           src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop"
           alt="Premium Furniture"
           className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
         />
         <div className="absolute bottom-10 left-10 z-20 text-white">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;Bu site tasarımı, mobilya alışverişini bir sanat eserine dönüştürüyor.&rdquo;
              </p>
              <footer className="text-sm">Sofia Davis - Interior Designer</footer>
            </blockquote>
         </div>
      </div>
    </div>
  );
}