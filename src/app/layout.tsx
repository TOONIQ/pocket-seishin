import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ポケット制作進行",
  description: "フリーランスアニメーター向けカット管理アプリ",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "ポケット制作進行",
    description: "フリーランスアニメーター向けカット管理アプリ",
    url: "https://pocket-seishin.vercel.app",
    siteName: "ポケット制作進行",
    images: [
      {
        url: "https://pocket-seishin.vercel.app/og-image.png",
        width: 1280,
        height: 670,
        alt: "ポケット制作進行 - ダッシュボード・カット一覧・スケジュール画面",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ポケット制作進行",
    description: "フリーランスアニメーター向けカット管理アプリ",
    images: ["https://pocket-seishin.vercel.app/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ポケット制作進行",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

// Inline script to prevent flash of wrong theme
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('seishin-theme');
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch(e) {
    // default: light
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
