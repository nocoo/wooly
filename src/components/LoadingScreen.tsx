"use client";

import { Logo } from "@/components/Logo";

export function LoadingScreen() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Logo size="xl" className="animate-pulse" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}
