import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "きんぎょの水族館",
  description: "金魚をかけあわせて、新しい種類を見つける水族館ゲーム。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
