import { type DefaultSession } from "next-auth";

// NextAuth modülünü genişletiyoruz
declare module "next-auth" {
  /**
   * Session.user nesnesine 'role' alanını ekliyoruz
   */
  interface Session {
    user: {
      id: string;
      role: "admin" | "customer";
    } & DefaultSession["user"];
  }

  /**
   * User nesnesine 'role' alanını ekliyoruz
   */
  interface User {
    role: "admin" | "customer";
  }
}