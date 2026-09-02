import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { connection } from "next/server";
import "./tailwind.generated.css";
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // A fresh CSP nonce exists only at request time, so the whole route tree must
  // render dynamically instead of reusing build-time HTML.
  await connection();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
