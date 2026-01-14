import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css"; // DİKKAT: CSS yolu değişti
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/layout/header";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/lib/i18n/routing';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Instant Design",
  description: "Premium Furniture Store",
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main>{children}</main>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}