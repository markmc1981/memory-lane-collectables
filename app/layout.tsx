import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { config } from "@/lib/config";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(config.site.url),
  title: {
    default: "Memory Lane Collectables — objects with a past, ready for their next chapter",
    template: "%s | Memory Lane Collectables",
  },
  description:
    "A curated circular-commerce brand from Scotland. Discover vintage furniture, antiques and collectables — identified, researched and regenerated for a new generation.",
  openGraph: {
    type: "website",
    siteName: "Memory Lane Collectables",
    locale: "en_GB",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" className={`${fraunces.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
