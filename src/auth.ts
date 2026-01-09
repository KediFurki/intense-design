import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/server/db";
import { accounts, sessions, users, verificationTokens } from "@/server/db/schema";
import authConfig from "./auth.config";
import type { Adapter } from "next-auth/adapters";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }) as Adapter,
  
  session: { strategy: "jwt" },

  // Önce genel ayarları (Providers, Pages vb.) alıyoruz
  ...authConfig,

  // Sonra Callback'leri manuel olarak birleştiriyoruz
  callbacks: {
    // authConfig içindeki (middleware için olan) ayarları koru
    ...authConfig.callbacks,

    // Backend için gerekli olan JWT ve Session mantığını ekle
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        // TypeScript artık bunu tanıdığı için @ts-expect-error sildik
        session.user.role = token.role as "admin" | "customer";
      }
      return session;
    },
  },
});