import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Memory Lane Collectables",
    template: "%s | Memory Lane Collectables",
  },
  description:
    "Vintage furniture, antiques and collectables recovered from Scottish house clearances.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
