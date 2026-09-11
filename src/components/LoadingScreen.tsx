"use client";

import { LoadingScreen as BasaltLoadingScreen } from "@nocoo/basalt/components/loading-screen";
import { Logo } from "@/components/Logo";

export function LoadingScreen({ label = "Loading" }: { label?: string }) {
  return (
    <BasaltLoadingScreen
      label={label}
      mark={<Logo size="lg" />}
    />
  );
}
