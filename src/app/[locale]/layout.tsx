import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
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
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}>) {
  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams.locale;

  if (!isAppLocale(locale)) notFound();

  const messages = await getMessages();

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
          <Header locale={locale} />
          <main>{children}</main>
          <footer className="border-t border-slate-200 py-4">
            <div className="container mx-auto flex flex-wrap items-center justify-center gap-4 px-4 text-sm text-slate-500">
              <a
                href="https://www.iubenda.com/privacy-policy/69743893"
                className="iubenda-white iubenda-noiframe iubenda-embed transition-colors hover:text-slate-900"
                title="Privacy Policy"
              >
                Privacy Policy
              </a>
              <a
                href="https://www.iubenda.com/privacy-policy/69743893/cookie-policy"
                className="iubenda-white iubenda-noiframe iubenda-embed transition-colors hover:text-slate-900"
                title="Cookie Policy"
              >
                Cookie Policy
              </a>
            </div>
          </footer>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}