"use client"
import { Toaster } from "react-hot-toast";
import "./globals.css";
import SessionProvider from "./SessionProvider";
import { CartProvider } from "react-use-cart";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-gray-900">
      <body className="h-full">
        <SessionProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </SessionProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
