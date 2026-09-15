import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://agrinova.market'),
  title: "AgriNova - Agricultural Trading and Logistics Platform",
  description: "Direct produce trading platform connecting verified farmers, wholesale buyers, and transporters with mandi intelligence and logistics dispatch.",
  keywords: ["agriculture", "mandi marketplace", "farmer trading", "wholesale produce", "freight dispatch", "India", "AgriNova"],
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "AgriNova - Agricultural Trading and Logistics Platform",
    description: "Direct produce trading platform connecting verified farmers, wholesale buyers, and transporters.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={inter.className}>
        <LanguageProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                },
                success: { iconTheme: { primary: '#52A352', secondary: '#fff' } },
                error: { iconTheme: { primary: '#F44336', secondary: '#fff' } },
              }}
            />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
