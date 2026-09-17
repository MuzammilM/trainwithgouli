import type { Metadata, Viewport } from "next";
import { Anton, Archivo, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/Footer";
import { VersionPill } from "@/components/VersionPill";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "trainwithgouli — coaching by Harish Gouli",
    template: "%s — trainwithgouli",
  },
  description:
    "Gritty workout tracking. Log lifts, chase numbers, earn the next plate.",
};

export const viewport: Viewport = {
  themeColor: "#211b1d",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${archivo.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Footer />
        <VersionPill />
      </body>
    </html>
  );
}
