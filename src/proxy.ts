import NextAuth from "next-auth";
import authConfig from "./auth.config";
import createMiddleware from "next-intl/middleware";
import { routing } from "./lib/i18n/routing";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isAdminRoute = nextUrl.pathname.includes("/admin");
  const isAuthRoute = nextUrl.pathname.includes("/login");

  if (isApiAuthRoute) return;

  if (isAdminRoute && !isLoggedIn) {
    const locale = nextUrl.pathname.split("/")[1] || routing.defaultLocale;
    const safeLocale = routing.locales.includes(locale as (typeof routing.locales)[number])
      ? locale
      : routing.defaultLocale;

    return Response.redirect(new URL(`/${safeLocale}/login`, nextUrl));
  }

  if (isAuthRoute && isLoggedIn) {
    const locale = nextUrl.pathname.split("/")[1] || routing.defaultLocale;
    const safeLocale = routing.locales.includes(locale as (typeof routing.locales)[number])
      ? locale
      : routing.defaultLocale;

    return Response.redirect(new URL(`/${safeLocale}`, nextUrl));
  }

  // Apply intl middleware
  const intlResponse = intlMiddleware(req);

  // If intl middleware redirects (e.g. missing locale prefix), honour it
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  // Build request headers with our custom pathname
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", nextUrl.pathname);

  // Preserve the intl middleware's URL rewrite (if any) so locale routing works
  const rewriteUrl = intlResponse.headers.get("x-middleware-rewrite");

  const response = rewriteUrl
    ? NextResponse.rewrite(new URL(rewriteUrl), { request: { headers: requestHeaders } })
    : NextResponse.next({ request: { headers: requestHeaders } });

  // Copy non-internal headers & cookies from intl middleware
  intlResponse.headers.forEach((value, key) => {
    if (!key.startsWith("x-middleware-")) {
      response.headers.set(key, value);
    }
  });
  for (const cookie of intlResponse.cookies.getAll()) {
    response.cookies.set(cookie);
  }

  return response;
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};