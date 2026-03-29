"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logo size presets — mapped to standardized public/ assets.
 * - "sm"  -> 24px  (sidebar icon)     → /logo-24.png
 * - "lg"  -> 80px  (login/loading)    → /logo-80.png
 */
const SIZE_MAP = {
  sm: { px: 24, src: "/logo-24.png" },
  lg: { px: 80, src: "/logo-80.png" },
} as const;

type LogoSize = keyof typeof SIZE_MAP;

interface LogoProps {
  /** Preset size */
  size?: LogoSize;
  /** Additional CSS classes on the wrapper */
  className?: string;
}

export function Logo({ size = "sm", className }: LogoProps) {
  const { px, src } = SIZE_MAP[size];

  return (
    <Image
      src={src}
      alt="wooly logo"
      width={px}
      height={px}
      className={cn("shrink-0", className)}
      priority
    />
  );
}
