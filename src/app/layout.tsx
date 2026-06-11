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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Krisna Media",
  "image": "https://www.krisnamedia.id/logo.svg",
  "url": "https://www.krisnamedia.id",
  "telephone": "+628115191097",
  "email": "krisna.media.bdj@gmail.com",
  "description":
    "Solusi sound system, lighting, rental studio musik, dan perlengkapan alat musik di Banjarmasin, Kalimantan Selatan.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Jl. KS Tubun Rt 5 No 63",
    "addressLocality": "Banjarmasin",
    "addressRegion": "Kalimantan Selatan",
    "addressCountry": "ID",
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -3.3194,
    "longitude": 114.5895,
  },
  "sameAs": ["https://wa.me/628115191097"],
  "priceRange": "Rp",
  "areaServed": "Banjarmasin, Kalimantan Selatan",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Layanan Krisna Media",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Sound System",
        },
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Lighting",
        },
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Studio Musik",
        },
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Alat Musik & Aksesoris",
        },
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Kursus Musik (KMC)",
        },
      },
    ],
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "21:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Saturday", "Sunday"],
      "opens": "10:00",
      "closes": "22:00",
    },
  ],
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#0a0a0a]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
