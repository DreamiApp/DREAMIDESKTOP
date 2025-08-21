// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], weight: ["400", "600", "800", "900"] });

export const metadata = {
  metadataBase: new URL("https://dreamiapp.com"), // ← update later
  title: "DREAMI",
  description:
    "Dreami helps you capture, analyze, and interpret your dreams over a lifetime.",
  alternates: { canonical: "https://dreamiapp.com/" },
  openGraph: {
    title: "Dreami | Your Dream Companion",
    description: "Capture, analyze, and interpret your dreams over a lifetime.",
    url: "https://dreamiapp.com/",
    type: "website",
    images: [{ url: "https://example.com/og-image.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dreami | Your Dream Companion",
    description: "Capture, analyze, and interpret your dreams over a lifetime.",
    images: ["https://example.com/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
              "Dreami helps you capture, analyze, and interpret your dreams over a lifetime.",
            url: "https://dreamiapp.com/",
          })}
        </Script>
        {children}
      </body>
    </html>
  );
}
