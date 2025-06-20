import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import EnvironmentBanner from "@/components/EnvironmentBanner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GS Sync Connect Catalog",
  description: "Service de synchronisation des catalogues Grand Shooting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${inter.variable} antialiased`}
      >
        <EnvironmentBanner />
        {children}
      </body>
    </html>
  );
}
