import type { Metadata } from "next";
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
  metadataBase: new URL("https://twanty979-hue.github.io/SaveFor"),
  title: "SaveFor - ตัวช่วยบันทึกและวางแผนการเงิน",
  description: "บันทึกและติดตามรายรับรายจ่ายของคุณ วางแผนออมเงินอย่างชาญฉลาด",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SaveFor",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "SaveFor - ตัวช่วยบันทึกและวางแผนการเงิน",
    description: "บันทึกและติดตามรายรับรายจ่ายของคุณ วางแผนออมเงินอย่างชาญฉลาด",
    url: "https://twanty979-hue.github.io/SaveFor", 
    siteName: "SaveFor",
    locale: "th_TH",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
