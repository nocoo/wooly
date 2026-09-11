"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ThemeProvider,
  TooltipProvider,
  LinkProvider,
  Toaster,
} from "@nocoo/basalt";
import { AccentProvider } from "@nocoo/basalt/providers/accent";

const PALETTE_OVERRIDES = {
  primary: {
    light: "320 70% 55%",
    dark: "320 70% 60%",
  },
} as const;

function AppNextLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function BasaltProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <AccentProvider
        defaultAccent="primary"
        paletteOverrides={PALETTE_OVERRIDES}
      >
        <LinkProvider render={AppNextLink}>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </LinkProvider>
      </AccentProvider>
    </ThemeProvider>
  );
}
