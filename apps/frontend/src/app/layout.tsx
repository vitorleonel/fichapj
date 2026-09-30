import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SITE } from "@/lib/site";

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
  metadataBase: new URL(SITE),

  // The template carries the brand, so a page names only itself.
  title: {
    default: "Consulta de CNPJ — Ficha PJ",
    template: "%s — Ficha PJ",
  },
  description:
    "Consulte o CNPJ de qualquer empresa e veja situação, sócios, endereço e atividade.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
