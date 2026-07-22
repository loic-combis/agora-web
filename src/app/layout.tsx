import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { Nav } from "@/components/navigation/nav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Agora — Droit français applicable au fil du temps",
    template: "%s · Agora",
  },
  description:
    "Explorez l'évolution jour par jour du droit français applicable : historique des versions, différences entre textes, et contenu des articles.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col">
        <Nav />
        <main className="w-full h-full overflow-x-hidden pb-14 md:pb-0 md:pl-16 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
