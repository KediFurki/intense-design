"use client";

import { startTransition, useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Globe, MessagesSquare, KeyRound, Sparkles } from "lucide-react";
import { useRouter } from "@/lib/i18n/routing";
import { registerUser } from "@/server/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FormState = {
  name: string;
  email: string;
  password: string;
};

const initialSignIn: FormState = {
  name: "",
  email: "",
  password: "",
};

const initialRegister: FormState = {
  name: "",
  email: "",
  password: "",
};

export default function CredentialsAuthPanel() {
  const locale = useLocale();
  const t = useTranslations("Auth");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("signin");
  const [signInForm, setSignInForm] = useState<FormState>(initialSignIn);
  const [registerForm, setRegisterForm] = useState<FormState>(initialRegister);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const homeHref = `/${locale}`;

  function updateSignInField(field: keyof FormState, value: string) {
    setSignInForm((current) => ({ ...current, [field]: value }));
  }

  function updateRegisterField(field: keyof FormState, value: string) {
    setRegisterForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCredentialsSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSigningIn(true);

    const result = await signIn("credentials", {
      email: signInForm.email.trim().toLowerCase(),
      password: signInForm.password,
      redirect: false,
      callbackUrl: homeHref,
    });

    setIsSigningIn(false);

    if (!result || result.error) {
      toast.error(t("invalidCredentials"));
      return;
    }

    router.replace("/");
    router.refresh();
  }

  function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsRegistering(true);

    startTransition(async () => {
      const result = await registerUser(
        registerForm.name,
        registerForm.email,
        registerForm.password,
      );

      setIsRegistering(false);

      if (!result.success) {
        toast.error(result.error || t("createAccountFailed"));
        return;
      }

      toast.success(t("accountCreated"));
      setRegisterForm(initialRegister);
      setSignInForm((current) => ({ ...current, email: registerForm.email.trim().toLowerCase() }));
      setActiveTab("signin");
    });
  }

  async function handleOAuthSignIn(provider: "google" | "facebook") {
    await signIn(provider, { callbackUrl: homeHref });
  }

  return (
    <div className="grid min-h-screen w-full bg-[linear-gradient(180deg,#fffaf3_0%,#fff8f1_42%,#f7efe5_100%)] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(191,142,95,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(214,177,133,0.18),transparent_28%)]" />
        <div className="relative flex items-center gap-3 px-10 py-8 text-stone-700">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e5d4be] bg-white/75 shadow-sm">
            <Sparkles className="size-5 text-[#a66a3f]" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b07d55]">Intense Design</p>
            <p className="text-sm text-stone-500">{t("brandSlogan")}</p>
          </div>
        </div>

        <div className="relative px-10 pb-16 pt-8">
          <div className="max-w-xl space-y-6">
            <span className="inline-flex rounded-full border border-[#ead8c2] bg-white/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-[#a66a3f] shadow-sm">
              {t("collectionBadge")}
            </span>
            <h1 className="text-5xl font-semibold leading-tight tracking-[-0.04em] text-stone-900">
              {t("heroTitle")}
            </h1>
            <p className="max-w-lg text-base leading-7 text-stone-600">
              {t("heroDescription")}
            </p>
          </div>
        </div>

        <div className="relative px-10 pb-10">
          <div className="rounded-[2rem] border border-white/70 bg-white/65 p-7 shadow-[0_24px_80px_rgba(111,78,55,0.08)] backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.2em] text-[#b07d55]">{t("clientAccess")}</p>
            <p className="mt-4 text-lg leading-8 text-stone-700">
              {t("clientAccessDescription")}
            </p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
        <Card className="w-full max-w-xl rounded-[2rem] border border-[#eadbc8] bg-white/88 py-0 shadow-[0_30px_90px_rgba(111,78,55,0.12)] backdrop-blur-xl">
          <CardHeader className="gap-3 border-b border-[#f0e5d8] px-8 py-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fcf1e5] text-[#a66a3f] shadow-sm">
              <KeyRound className="size-5" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                {t("welcomeBack")}
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-stone-500">
                {t("panelDescription")}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-8 py-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
              <TabsList className="grid h-12 w-full grid-cols-2 rounded-full bg-[#f7efe4] p-1">
                <TabsTrigger value="signin" className="rounded-full text-sm font-medium text-stone-600 data-[state=active]:bg-white data-[state=active]:text-stone-900">
                  {t("signInTab")}
                </TabsTrigger>
                <TabsTrigger value="register" className="rounded-full text-sm font-medium text-stone-600 data-[state=active]:bg-white data-[state=active]:text-stone-900">
                  {t("createAccountTab")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-0">
                <form className="space-y-5" onSubmit={handleCredentialsSignIn}>
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">{t("email")}</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={signInForm.email}
                      onChange={(event) => updateSignInField("email", event.target.value)}
                      placeholder={t("emailPlaceholder")}
                      className="h-12 rounded-xl border-[#e8dccf] bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">{t("password")}</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={signInForm.password}
                      onChange={(event) => updateSignInField("password", event.target.value)}
                      placeholder={t("passwordPlaceholder")}
                      className="h-12 rounded-xl border-[#e8dccf] bg-white"
                      required
                    />
                  </div>
                  <Button type="submit" className="h-12 w-full rounded-xl bg-[#6f4e37] text-white hover:bg-[#5d412e]" disabled={isSigningIn}>
                    {isSigningIn ? t("signingIn") : t("signIn")}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-0">
                <form className="space-y-5" onSubmit={handleRegister}>
                  <div className="space-y-2">
                    <Label htmlFor="register-name">{t("fullName")}</Label>
                    <Input
                      id="register-name"
                      value={registerForm.name}
                      onChange={(event) => updateRegisterField("name", event.target.value)}
                      placeholder={t("fullNamePlaceholder")}
                      className="h-12 rounded-xl border-[#e8dccf] bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">{t("email")}</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={registerForm.email}
                      onChange={(event) => updateRegisterField("email", event.target.value)}
                      placeholder={t("emailPlaceholder")}
                      className="h-12 rounded-xl border-[#e8dccf] bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">{t("password")}</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={registerForm.password}
                      onChange={(event) => updateRegisterField("password", event.target.value)}
                      placeholder={t("passwordHint")}
                      className="h-12 rounded-xl border-[#e8dccf] bg-white"
                      required
                    />
                  </div>
                  <Button type="submit" className="h-12 w-full rounded-xl bg-[#6f4e37] text-white hover:bg-[#5d412e]" disabled={isRegistering}>
                    {isRegistering ? t("creatingAccount") : t("createAccount")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-8 space-y-5">
              <div className="relative">
                <Separator className="bg-[#efe3d5]" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-xs font-medium uppercase tracking-[0.22em] text-stone-400">
                  {t("orContinueWith")}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl border-[#eadbc8] bg-white text-stone-700 hover:bg-[#fff7ef]"
                  onClick={() => handleOAuthSignIn("google")}
                >
                  <Globe className="size-4" />
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl border-[#eadbc8] bg-[#1877F2] text-white hover:bg-[#1667d8] hover:text-white"
                  onClick={() => handleOAuthSignIn("facebook")}
                >
                  <MessagesSquare className="size-4" />
                  Facebook
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}