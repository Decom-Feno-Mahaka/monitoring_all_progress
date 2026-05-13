import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "DFM Project Monitor",
    template: "%s | DFM Project Monitor",
  },
  description:
    "Platform monitoring project modern untuk memantau progress software, AI, IoT, riset, dan development secara real-time.",
  keywords: ["project monitoring", "dashboard", "progress tracking", "DFM"],
  authors: [{ name: "DFM Team" }],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "DFM Project Monitor",
    description: "Dynamic Project Tracking Platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
