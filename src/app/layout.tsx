import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

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
    default: "MarketMath — fundamentals, clearly",
    template: "%s · MarketMath",
  },
  description:
    "Long-horizon fundamentals, valuation math, and quality screens for US companies. Data from SEC filings.",
  applicationName: "MarketMath",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MarketMath",
  },
};

export const viewport: Viewport = {
  themeColor: "#fcfcfd",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
