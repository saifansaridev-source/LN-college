import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LN College - General Secretary Election 2026",
  description: "Official Kiosk Voting Portal for LN College General Secretary Student Election",
  keywords: ["LN College", "Student Election", "General Secretary", "Voting Kiosk"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-cream">
      <body className="h-full flex flex-col antialiased selection:bg-gold-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
