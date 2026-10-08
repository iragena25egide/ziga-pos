import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import ClientLayout from "@/components/ClientLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ziga POS",
  description: "Professional sales, inventory, loans, and business dashboard.",
  manifest: "/site.webmanifest",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans text-sm antialiased bg-background text-foreground">
        <ClientLayout>
          {children}
        </ClientLayout>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
