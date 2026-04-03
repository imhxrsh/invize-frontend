import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://invize.in"),
  title: {
    default: "Invize - AI-Powered Invoice Automation",
    template: "%s | Invize",
  },
  description:
    "Streamline your invoice processing with AI-powered automation. Transform your business with intelligent invoice management and automated workflows.",
  keywords: [
    "invoice automation",
    "AI invoice processing",
    "invoice management",
    "business automation",
    "invoice software",
    "AI-powered invoicing",
  ],
  authors: [{ name: "Harsh Vishwakarma" }],
  creator: "Harsh Vishwakarma",
  publisher: "Harsh Vishwakarma",
  applicationName: "Invize",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://invize.in",
    siteName: "Invize",
    title: "Invize - AI-Powered Invoice Automation",
    description:
      "Streamline your invoice processing with AI-powered automation. Transform your business with intelligent invoice management and automated workflows.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Invize - AI-Powered Invoice Automation",
    description:
      "Streamline your invoice processing with AI-powered automation. Transform your business with intelligent invoice management and automated workflows.",
  },
  alternates: {
    canonical: "https://invize.in",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${inter.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
