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
  userScalable: false,              // disable pinch/double-tap zoom
  viewportFit: "cover",             // iOS: extend under notch/home bar
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

  // Favicons for browsers & Google SERP (PNG at multiples of 48px + versioned URLs)
  icons: {
    icon: [
      { url: "/favicon-48.png?v=3",  type: "image/png", sizes: "48x48" },
      { url: "/favicon-192.png?v=3", type: "image/png", sizes: "192x192" },
      { url: "/favicon.ico?v=3" }, // ICO fallback for older UAs
    ],
    apple: [{ url: "/apple-touch-icon.png?v=3", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico?v=3"],
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
        {/* Organization schema: brand logo (absolute URL to 512 PNG) */}
        <Script id="schema-organization" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": "https://www.dreamiapp.com/#organization",
            name: "Dreami",
            url: "https://www.dreamiapp.com/",
            logo: {
              "@type": "ImageObject",
              url: "https://www.dreamiapp.com/favicon-512.png",
              width: 512,
              height: 512,
            },
            sameAs: [
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
