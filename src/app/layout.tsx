import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { UserProvider } from "@/lib/user-context";

export const metadata: Metadata = {
  title: "Thrift Collision — Premium Thrifted Streetwear",
  description:
    "Curating the best in thrifted drops. Unisex streetwear. Sustainably sourced. Drop every week.",
  openGraph: {
    title: "Thrift Collision",
    description: "Premium thrifted streetwear drops, weekly.",
    url: "https://thriftcollision.com",
    siteName: "Thrift Collision",
    locale: "en_GB",
    type: "website",
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
      </body>
    </html>
  );
}
