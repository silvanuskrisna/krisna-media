import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Krisna Media — Sound | Lighting | Studio | Gear",
    template: "%s | Krisna Media",
  },
  description:
    "Solusi sound system, lighting, rental studio musik, dan perlengkapan alat musik di Banjarmasin, Kalimantan Selatan.",
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: "Krisna Media",
    description:
      "Sound, Lighting, Studio & Music Gear di Banjarmasin",
    siteName: "Krisna Media",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0a]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
