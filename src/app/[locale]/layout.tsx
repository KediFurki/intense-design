import { Inter } from "next/font/google";
import Script from "next/script";
import "../globals.css";
import { auth, signOut } from "@/auth";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { db } from "@/server/db";
import { categories } from "@/server/db/schema";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Viewport } from "next";
import { getLocaleValue } from "@/lib/i18n/get-locale-value";
import { routing } from "@/lib/i18n/routing";
import { getSettings } from "@/server/actions/settings";
import MaintenanceScreen from "@/components/layout/maintenance-screen";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
  params: Promise<{ locale: string }>;
}>) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;

  if (!isAppLocale(locale)) notFound();

  const [messages, session, categoryList, siteSettings] = await Promise.all([
    getMessages(),
    auth(),
    db.select().from(categories),
    getSettings(),
  ]);

  const headersList = await headers();
  const pathname =
    headersList.get("x-pathname") ||
    headersList.get("x-invoke-path") ||
    "";
  const isMaintenanceMode = siteSettings?.maintenanceMode === true;
  const isAdmin = session?.user?.role === "admin";
  const isExempt =
    isAdmin ||
    pathname.includes("/admin") ||
    pathname.includes("/login") ||
    pathname.includes("/auth") ||
    pathname.includes("/api");

  if (isMaintenanceMode && !isExempt) {
    return (
      <html lang={locale} suppressHydrationWarning>
        <body className={inter.className} suppressHydrationWarning>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <MaintenanceScreen />
          </NextIntlClientProvider>
        </body>
      </html>
    );
  }

  const localizedCategories = categoryList.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: getLocaleValue(category.name, locale),
  }));

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
            categoryList={localizedCategories}
            sessionUser={session?.user ?? null}
            signOutAction={handleSignOut}
          />
          <main>{children}</main>
          <Footer />
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}