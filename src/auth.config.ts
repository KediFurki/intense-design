import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";

// Bu dosya Database bağlantısı içermez, Edge Runtime'da güvenle çalışır.
export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    }),
  ],
  // Login sayfasına yönlendirme ayarı
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: nextUrl }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.nextUrl.pathname.startsWith("/admin");
      
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }
      return true;
    },
  },
} satisfies NextAuthConfig;