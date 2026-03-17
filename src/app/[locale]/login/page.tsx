import { auth } from "@/auth";
import CredentialsAuthPanel from "@/components/auth/credentials-auth-panel";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();

  // Eğer kullanıcı zaten giriş yapmışsa ana sayfaya at
  if (session?.user) {
    redirect("/");
  }

  return <CredentialsAuthPanel />;
}