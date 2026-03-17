import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "../globals.css";
import { auth, signOut } from "@/auth";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/layout/header";
import { db } from "@/server/db";
import { categories } from "@/server/db/schema";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getLocaleValue } from "@/lib/i18n/get-locale-value";
import { routing } from "@/lib/i18n/routing";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Intense Design",
  description: "Premium Furniture Store",
};

type AppLocale = (typeof routing.locales)[number];

function isAppLocale(locale: string): locale is AppLocale {
  return routing.locales.includes(locale as AppLocale);
}

async function handleSignOut() {
  "use server";

  await signOut();
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}>) {
  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams.locale;

  if (!isAppLocale(locale)) notFound();

  const [messages, session, categoryList, t] = await Promise.all([
    getMessages(),
    auth(),
    db.select().from(categories),
    getTranslations("Navigation"),
  ]);

  const localizedCategories = categoryList.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: getLocaleValue(category.name, locale),
  }));

  const labels = {
    home: t("home"),
    about: t("about"),
    profile: t("profile"),
    admin: t("admin"),
    logout: t("logout"),
    login: t("login"),
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Script
          src="https://embeds.iubenda.com/widgets/97709d19-c94c-4c51-a896-5d0e5bdd3b5f.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdn.iubenda.com/iubenda.js"
          strategy="lazyOnload"
        />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header
            locale={locale}
            categoryList={localizedCategories}
            labels={labels}
            sessionUser={session?.user ?? null}
            signOutAction={handleSignOut}
          />
          <main>{children}</main>
          <footer>
            <div className="container mx-auto flex flex-wrap items-center justify-center gap-4 px-4 py-6 text-xs text-stone-400">
              <a
                href="https://www.iubenda.com/privacy-policy/69743893"
                className="iubenda-white iubenda-noiframe iubenda-embed transition-colors hover:text-stone-600"
                title="Privacy Policy"
              >
                Privacy Policy
              </a>
              <a
                href="https://www.iubenda.com/privacy-policy/69743893/cookie-policy"
                className="iubenda-white iubenda-noiframe iubenda-embed transition-colors hover:text-stone-600"
                title="Cookie Policy"
              >
                Cookie Policy
              </a>
              <a href={`/${locale}#iubenda-privacy-choices`} className="iubenda-cs-preferences-link transition-colors hover:text-stone-600">
                Your Privacy Choices
              </a>
              <a href={`/${locale}#iubenda-notice-at-collection`} className="iubenda-cs-uspr-link transition-colors hover:text-stone-600">
                Notice at Collection
              </a>
            </div>
          </footer>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}