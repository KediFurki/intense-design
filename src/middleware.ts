import NextAuth from "next-auth";
import authConfig from "./auth.config";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const { auth } = NextAuth(authConfig);

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute = nextUrl.pathname === "/" || nextUrl.pathname.startsWith("/login");
  const isAdminRoute = nextUrl.pathname.includes("/admin");

  if (isApiAuthRoute) return;

  if (isAdminRoute && !isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  // i18n middleware'ini her zaman çalıştır
  return intlMiddleware(req);
});

export const config = {
  // Statik dosyaları ve API'leri hariç tut
  matcher: ['/((?!api|_next|.*\\..*).*)', '/', '/(tr|en|bg|de)/:path*']
};