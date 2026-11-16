import "@fontsource-variable/inter";
import "./globals.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: { default: "Avenra", template: "%s · Avenra" },
  description: "From Intent to Completed Work.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Reading the request makes every page render per request, which lets
  // Next.js attach the CSP nonce from src/proxy.ts to its scripts. A statically
  // pre-rendered page could not carry a per-request nonce.
  await headers();

  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
