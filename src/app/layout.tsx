import type { Metadata } from "next";
import { Inter, DM_Sans, Caveat } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { BasaltProviders } from "@/components/BasaltProviders";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-dm-sans",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: "wooly - 家庭权益追踪面板",
  description: "A Next.js application built on the basalt design system.",
  authors: [{ name: "wooly" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var stored=null;try{stored=window.localStorage.getItem("theme");}catch(e){}var prefersDark=window.matchMedia("(prefers-color-scheme: dark)").matches;var isDark=stored==="dark"||(stored!=="light"&&prefersDark);document.documentElement.classList.toggle("dark",isDark);document.documentElement.classList.toggle("light",!isDark);document.documentElement.dataset.mode=isDark?"dark":"light";})()`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${dmSans.variable} ${caveat.variable} antialiased`}>
        <SessionProvider>
          <BasaltProviders>{children}</BasaltProviders>
        </SessionProvider>
      </body>
    </html>
  );
}
