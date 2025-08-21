// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import Script from "next/script";
import type { Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "800", "900"],
});

export const metadata: Metadata = {
  // Use your canonical host (you’re redirecting apex -> www)
  metadataBase: new URL("https://www.dreamiapp.com"),
  title: {
    default: "Dreami — Your Dream Companion",
    template: "%s · Dreami",
  },
  description:
    "Capture, analyze, and interpret your dreams over a lifetime. Private by design.",
  alternates: {
    canonical: "/", // with metadataBase this resolves to https://www.dreamiapp.com/
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Dreami",
    title: "Dreami — Your Dream Companion",
    description:
      "Capture, analyze, and interpret your dreams over a lifetime. Private by design.",
    images: [{ url: "/og.png", width: 1200, height: 630 }], // add public/og.png
  },
  twitter: {
    card: "summary_large_image",
    title: "Dreami — Your Dream Companion",
    description:
      "Capture, analyze, and interpret your dreams over a lifetime. Private by design.",
    images: ["/og.png"],
  },
  icons: {
    icon: [{ url: "/favicon.ico", type: "image/x-icon" }], // uses public/favicon.ico
    shortcut: ["/favicon.ico"],
    apple: ["/apple-touch-icon.png"], // optional: create public/apple-touch-icon.png
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="no-js">
      <body className={inter.className}>
        {/* Schema.org JSON-LD */}
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
          })}
        </Script>
        {children}
      </body>
    </html>
  );
}
