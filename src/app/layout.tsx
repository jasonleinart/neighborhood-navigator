import type { Metadata } from "next";
import Script from "next/script";
import { getBranding } from "@/config/branding";
import "./globals.css";

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

const branding = getBranding();

export const metadata: Metadata = {
  metadataBase: new URL(branding.siteUrl),
  title: {
    default: branding.siteName,
    template: `%s | ${branding.siteName}`,
  },
  description: branding.siteDescription,
  openGraph: {
    title: branding.siteName,
    description: branding.siteDescription,
    url: branding.siteUrl,
    siteName: branding.siteName,
    images: [
      {
        url: branding.ogImage,
        width: 1200,
        height: 630,
        alt: branding.siteName,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: branding.siteName,
    description: branding.siteDescription,
    images: [branding.ogImage],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content={branding.primaryColor} />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {plausibleDomain && (
          <Script
            defer
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        )}
        <Script id="sw-register" strategy="afterInteractive">
          {`if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`}
        </Script>
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <header className="border-b border-gray-200 bg-white no-print">
          <div className="mx-auto max-w-3xl px-4 py-4">
            <a href="/" className="text-xl font-bold text-primary">
              {branding.siteName}
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
        <footer className="border-t border-gray-200 no-print">
          <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-muted">
            <p>{branding.footerText}</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
