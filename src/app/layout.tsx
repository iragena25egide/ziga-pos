import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import ClientLayout from "@/components/ClientLayout";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pos.zigga.io"),
  title: {
    default: "Ziga POS — Modern Retail POS, Inventory & Business Management",
    template: "%s | Ziga POS",
  },
  description:
    "Professional Point of Sale and store management platform. Fast checkout, offline auto-sync, barcode scanning, loans tracking, and real-time inventory management.",
  keywords: [
    "Ziga POS",
    "Point of Sale Rwanda",
    "Retail POS System",
    "Inventory Management Software",
    "Supermarket POS",
    "Store Management Platform",
    "Offline POS",
  ],
  authors: [{ name: "Ziga POS Team", url: "https://zigga.io" }],
  creator: "Ziga POS",
  publisher: "Ziga POS",
  alternates: {
    canonical: "https://pos.zigga.io",
  },
  openGraph: {
    title: "Ziga POS — Modern Retail POS, Inventory & Business Management",
    description:
      "All-in-one store management platform. Fast checkout, offline auto-sync, thermal printing, and real-time inventory.",
    url: "https://pos.zigga.io",
    siteName: "Ziga POS",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/favicon.png",
        width: 512,
        height: 512,
        alt: "Ziga POS Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ziga POS — Modern Retail POS System",
    description:
      "Fast checkout, offline sync, loans, and real-time inventory management for modern stores.",
    images: ["/favicon.png"],
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="font-sans text-sm antialiased bg-background text-foreground">
        <ClientLayout>
          {children}
        </ClientLayout>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
