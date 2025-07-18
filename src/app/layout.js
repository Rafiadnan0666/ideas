import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
});

export const metadata = {
   metadataBase: new URL("https://ideas-wheat.vercel.app"), // Ganti kalau beda domain
  title: {
    default: "Ideas – Real-time team notes & collaboration",
    template: "%s | Ideas",
  },
  description: "Collaborate with your team in real time. Share notes, post updates, and stay synced — all in one simple, elegant app.",
  keywords: [
    "team collaboration",
    "real-time notes",
    "project management",
    "team communication",
    "supabase template",
    "next.js template"
  ],
  openGraph: {
    title: "Ideas – Real-time team notes & collaboration",
    description: "Collaborate with your team in real time. Share notes, post updates, and stay synced — all in one simple, elegant app.",
    url: "https://ideas-wheat.vercel.app",
    siteName: "Ideas",
    images: [
      {
        url: "https://ideas-wheat.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ideas app preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ideas – Real-time team notes & collaboration",
    description: "Collaborate with your team in real time. Share notes, post updates, and stay synced — all in one simple, elegant app.",
    images: ["https://ideas-wheat.vercel.app/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <meta name="google-site-verification" content="YuQrC7DcNbYUtrPZKWXZ_GgDqm8QkVGwpmigcHODNT0" />
      <body className={`${inter.className} antialiased min-h-screen`}>
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
} 