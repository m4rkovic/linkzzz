import type { Metadata } from "next";
import type { ReactNode } from "react";
import { connection } from "next/server";
import "./globals.css";

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

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  // A fresh CSP nonce exists only at request time, so the whole route tree must
  // render dynamically instead of reusing build-time HTML.
  await connection();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
