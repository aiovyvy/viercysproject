import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
// Editorial serif for display headings, legible sans for everything else.
// Exposed as CSS variables so pages adopt them as they are redesigned.
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
const text = Inter({ subsets: ["latin"], variable: "--font-text" });
export const metadata: Metadata = {
  title: "VIERCYS | Where Earth Meets the Sea",
  description:
    "Discover a slower rhythm at VIERCYS Santorini. A Mediterranean escape, shaped by the sea.",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
  manifest: "/manifest.webmanifest",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${text.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
