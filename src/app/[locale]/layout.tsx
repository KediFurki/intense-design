import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/layout/header";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
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

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}) {
  // Next 16 / Turbopack bazı durumlarda params'ı Promise verir
  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams.locale;

  if (!isAppLocale(locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <Header locale={locale} />
          <main>{children}</main>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}