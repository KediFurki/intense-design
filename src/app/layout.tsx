import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/layout/header"; // <-- Yeni Header

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Instant Design",
  description: "Premium Furniture Store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Header'ı en tepeye koyduk */}
        <Header /> 
        
        <main>
          {children}
        </main>
        
        <Toaster /> 
      </body>
    </html>
  );
}