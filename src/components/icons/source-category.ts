import { CreditCard, Shield, Crown, Smartphone, Package } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

/**
 * Lucide icon for each source category. Centralized here so SourceCard
 * (compact card view) and the detail page header (large icon plate)
 * stay in lockstep — previously they kept their own copies and the
 * detail page rendered the raw category string when source.icon.type
 * was "category".
 *
 * Exposed as a constant map (not a function) so callers can do
 * CATEGORY_ICONS[category] ?? CATEGORY_ICONS.other in render — the
 * react-hooks ESLint rule for React 19 treats function calls in render
 * that return component types as "creating components in render" even
 * when they're pure lookups, so we keep the map indirect-only.
 */
export const CATEGORY_ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  "credit-card": CreditCard,
  insurance: Shield,
  membership: Crown,
  telecom: Smartphone,
  other: Package,
};
