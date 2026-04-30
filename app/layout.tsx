import type { Metadata } from "next";
import ConditionalFooter from "@/app/components/ConditionalFooter";
import { Geist, Geist_Mono } from "next/font/google";
import ConditionalHeader from "@/app/components/ConditionalHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProConfection Shop",
  description: "Application e-commerce pour vetements, chaussures et accessoires",
  icons: {
    icon: "/logo-proconfection.png",
    shortcut: "/logo-proconfection.png",
    apple: "/logo-proconfection.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ConditionalHeader />
        <main className="flex-1">{children}</main>
        <ConditionalFooter />
      </body>
    </html>
  );
}
