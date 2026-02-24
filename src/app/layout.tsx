import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neighborhood Navigator",
  description:
    "Find assistance programs you qualify for — property tax relief, home repair, utility help, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <header className="border-b border-gray-200 bg-white no-print">
          <div className="mx-auto max-w-3xl px-4 py-4">
            <a href="/" className="text-xl font-bold text-primary">
              Neighborhood Navigator
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
        <footer className="border-t border-gray-200 no-print">
          <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-muted">
            <p>
              This tool provides general information about assistance programs.
              Program details change — always confirm eligibility by contacting
              the program directly before applying.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
