// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import Script from "next/script";
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,      // disable pinch/double-tap zoom
  viewportFit: "cover",     // iOS: extend under notch/home bar
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#040208" },
    { media: "(prefers-color-scheme: light)", color: "#040208" },
  ],
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.dreamiapp.com"),
  title: {
    default: "Dreami — Your Dream Companion",
    template: "%s · Dreami",
  },
  description:
    "Capture, analyze, and interpret your dreams over a lifetime. Private by design.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Dreami",
    title: "Dreami — Your Dream Companion",
    description:
      "Capture, analyze, and interpret your dreams over a lifetime. Private by design.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dreami — Your Dream Companion",
    description:
      "Capture, analyze, and interpret your dreams over a lifetime. Private by design.",
    images: ["/og.png"],
  },
  // Favicons Google can use in search results (PNG ≥48px recommended)
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/png", sizes: "32x32" },
      { url: "/favicon.ico", type: "image/png", sizes: "48x48" }, // important for Google
      { url: "/favicon.ico", type: "image/png", sizes: "64x64" },
      { url: "/favicon.ico", type: "image/png", sizes: "192x192" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dreami",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="no-js">
      <body className={inter.className}>
        {/* Organization schema: helps Google pick your brand logo */}
        <Script id="schema-organization" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": "https://www.dreamiapp.com/#organization",
            name: "Dreami",
            url: "https://www.dreamiapp.com/",
            logo: {
              "@type": "ImageObject",
              url: "https://www.dreamiapp.com/favicon.ico",
              width: 512,
              height: 512,
            },
            sameAs: [
              // "https://twitter.com/yourhandle",
              "https://www.instagram.com/appdremai",
              "https://www.linkedin.com/company/dreamiapp",
            ],
          })}
        </Script>

        {/* Optional: SoftwareApplication schema */}
        <Script id="schema-software-app" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Dreami",
            applicationCategory: "LifestyleApplication",
            operatingSystem: "Web",
            description:
              "Capture, analyze, and interpret your dreams over a lifetime. Private by design.",
            url: "https://www.dreamiapp.com/",
            publisher: { "@id": "https://www.dreamiapp.com/#organization" },
          })}
        </Script>

        {children}
      </body>
    </html>
  );
}
