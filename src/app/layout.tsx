import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "wooly",
  description: "A Next.js application built on the basalt design system.",
  authors: [{ name: "wooly" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${dmSans.variable} antialiased`}>
        <TooltipProvider>
          <DashboardLayout>
            {children}
          </DashboardLayout>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
