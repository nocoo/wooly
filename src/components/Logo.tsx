"use client";

import Image from "next/image";
import { useAppliedTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

/**
 * Logo size presets mapped to pixel dimensions and logo file sizes.
 * - "sm"  → 20px (sidebar icon)
 * - "md"  → 32px (header / nav)
 * - "lg"  → 64px (login page)
 * - "xl"  → 128px (loading / splash)
 */
const SIZE_MAP = {
  sm: { px: 20, file: "32" },
  md: { px: 32, file: "32" },
  lg: { px: 64, file: "64" },
  xl: { px: 128, file: "128" },
} as const;

type LogoSize = keyof typeof SIZE_MAP;

interface LogoProps {
  /** Preset size */
  size?: LogoSize;
  /** Custom pixel size (overrides preset) */
  customSize?: number;
  /** Additional CSS classes on the wrapper */
  className?: string;
}

export function Logo({ size = "md", customSize, className }: LogoProps) {
  const applied = useAppliedTheme();

  const px = customSize ?? SIZE_MAP[size].px;
  const file = customSize
    ? px <= 32 ? "32" : px <= 64 ? "64" : px <= 128 ? "128" : "256"
    : SIZE_MAP[size].file;
  const variant = applied === "dark" ? "dark" : "light";

  return (
    <Image
      src={`/logo/${variant}-${file}.png`}
      alt="wooly logo"
      width={px}
      height={px}
      className={cn("shrink-0", className)}
      priority
    />
  );
}
