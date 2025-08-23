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
  userScalable: false,
  viewportFit: "cover",
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

  // Use the *existing* Dreami.png so we avoid 404s.
  // (v=4 just cache-busts; adjust if you change the file)
  icons: {
    icon: [
      { url: "/Dreami.png?v=4", type: "image/png", sizes: "48x48" },
      { url: "/Dreami.png?v=4", type: "image/png", sizes: "192x192" },
      { url: "/favicon.ico?v=4" }, // fallback if present
    ],
    apple: [{ url: "/Dreami.png?v=4", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico?v=4"],
  },

  manifest: "/site.webmanifest?v=4",
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
        {/* Organization schema: brand logo */}
        <Script id="schema-organization" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": "https://www.dreamiapp.com/#organization",
            name: "Dreami",
            url: "https://www.dreamiapp.com/",
            logo: {
              "@type": "ImageObject",
              url: "https://www.dreamiapp.com/Dreami.png?v=4",
              width: 512,
              height: 512,
            },
            sameAs: [
              "https://www.instagram.com/appdremai",
              "https://www.linkedin.com/company/dreamiapp",
            ],
          })}
        </Script>

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
