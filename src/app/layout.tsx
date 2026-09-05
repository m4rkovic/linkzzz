import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";

// Next already ships these Geist assets with the pinned framework version.
// Loading them locally keeps builds offline and screenshot metrics identical on
// Windows, Linux and CI instead of falling back to different system fonts.
const geistSans = localFont({
  src: "../../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "../../node_modules/next/dist/next-devtools/server/font/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Linkzzz — Intelligent links for every audience",
    template: "%s | Linkzzz",
  },
  description:
    "Build landing pages and direct links with smart destinations, geo routing, Traffic Shield and reliable analytics.",
  applicationName: "Linkzzz",
  keywords: [
    "smart links",
    "link in bio",
    "deeplinks",
    "geo routing",
    "link analytics",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
