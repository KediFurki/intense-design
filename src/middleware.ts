import NextAuth from "next-auth";
import authConfig from "./auth.config";

// Veritabanı bağlantısı olmayan hafif config'i kullanıyoruz
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // auth.config.ts içindeki 'authorized' callback'i burada otomatik çalışır.
  // Ekstra logic gerekirse buraya yazabilirsin.
});

export const config = {
  // Middleware'in çalışmayacağı static dosyalar (resimler vs.)
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};