import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "@/lib/auth/session-context";
import { PlatformProvider } from "@/lib/platform/platform-store";

export const metadata: Metadata = {
  title: "BJI MediSupport",
  description: "A connected healthcare web app for organization onboarding, staff access, patient journeys, and facility operations.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BJI MediSupport",
  },
  icons: {
    icon: "/icons/bji-medisupport-192.png",
    apple: "/icons/bji-medisupport-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BJI MediSupport" />
      </head>
      <body className="h-full bg-slate-50 antialiased text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
        <SessionProvider>
          <PlatformProvider>{children}</PlatformProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
