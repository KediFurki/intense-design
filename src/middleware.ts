import NextAuth from "next-auth";
import authConfig from "./auth.config";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const { auth } = NextAuth(authConfig);

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const { nextUrl } = req;
  
  const isLoggedIn = !!req.auth;
  const isAuthRoute = nextUrl.pathname.includes("/login") || nextUrl.pathname.includes("/register");
  const isAdminRoute = nextUrl.pathname.includes("/admin");
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");

  // API rotalarına karışma
  if (isApiAuthRoute) {
    return;
  }

  // Admin koruması (Login değilse login'e at)
  if (isAdminRoute && !isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  // Eğer kullanıcı giriş yapmışsa ve login sayfasına gitmeye çalışıyorsa ana sayfaya at
  if (isAuthRoute && isLoggedIn) {
    return Response.redirect(new URL("/", nextUrl));
  }

  // Diğer tüm rotalar için i18n middleware'ini çalıştır
  return intlMiddleware(req);
});

export const config = {
  // Hem dil dosyalarını hem de NextAuth gereksinimlerini kapsayan matcher
  matcher: ['/((?!api|_next|.*\\..*).*)', '/', '/(bg|en|tr|de)/:path*']
};