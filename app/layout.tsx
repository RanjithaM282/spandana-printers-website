import type { Metadata } from "next";
import { GeistSans, GeistMono } from 'geist/font';
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ThemeHandler from "@/components/ThemeHandler";
import "./globals.css";

// Geist fonts are now imported directly from 'geist/font' package

export const metadata: Metadata = {
  title: "Spandana Printers | All Printing Solutions",
  description:
    "End-to-end printing services for brochures, packaging, stationery, cartons, calendars, textbooks, and more with chat + PhonePe payments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} min-h-screen font-sans antialiased`}>
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-white via-blue-50 to-indigo-50 text-foreground">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}