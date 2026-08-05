import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { CartProvider } from "@/lib/cart-context";
import { UserProvider } from "@/lib/user-context";

export const metadata: Metadata = {
  title: "Thrift Collision — Unisex Thrifted Streetwear",
  description:
    "Unisex thrifted streetwear, curated and dropped weekly. Based in Abuja, shipping across Nigeria. Every drop hides a discovery.",
  metadataBase: new URL("https://thriftcollision.com"),
  openGraph: {
    title: "Thrift Collision",
    description: "Unisex thrifted streetwear drops, weekly.",
    url: "https://thriftcollision.com",
    siteName: "Thrift Collision",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Thrift Collision",
    description: "Unisex thrifted streetwear drops, weekly.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <UserProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </UserProvider>
        <Analytics />
      </body>
    </html>
  );
}
