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
  title: "E-Shop",
  description:
    "E-Shop — your destination for premium electronics: phones, laptops, audio, and accessories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: extensions (e.g. Dark Reader) may mutate attrs on body/svg/img before hydrate */}
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-zinc-950 text-zinc-100"
      >
        {children}
      </body>
    </html>
  );
}
