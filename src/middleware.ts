import NextAuth from "next-auth";
import authConfig from "./auth.config";
import createMiddleware from "next-intl/middleware";
import { routing } from "./lib/i18n/routing";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isAdminRoute = nextUrl.pathname.includes("/admin");
  const isAuthRoute = nextUrl.pathname.includes("/login");

  if (isApiAuthRoute) return;

  // Admin koruması
  if (isAdminRoute && !isLoggedIn) {
    const locale = nextUrl.pathname.split('/')[1] || routing.defaultLocale;
    
    // HATA DÜZELTİLDİ: 'as any' kaldırıldı
    const safeLocale = routing.locales.includes(locale as (typeof routing.locales)[number]) 
      ? locale 
      : routing.defaultLocale;
      
    return Response.redirect(new URL(`/${safeLocale}/login`, nextUrl));
  }

  // Login olmuş kullanıcıyı geri yönlendirme
  if (isAuthRoute && isLoggedIn) {
    const locale = nextUrl.pathname.split('/')[1] || routing.defaultLocale;
    
    // HATA DÜZELTİLDİ: 'as any' kaldırıldı
    const safeLocale = routing.locales.includes(locale as (typeof routing.locales)[number]) 
      ? locale 
      : routing.defaultLocale;
      
    return Response.redirect(new URL(`/${safeLocale}`, nextUrl));
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};