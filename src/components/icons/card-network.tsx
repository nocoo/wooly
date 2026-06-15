import type { ComponentType, SVGProps } from "react";

/**
 * Inline SVG card-network logos.
 *
 * Each component is a self-contained, brand-color SVG sized via the standard
 * width/height/className SVG props. We intentionally don't ship the official
 * artwork (trademark + binary asset weight) — these are simplified shape +
 * wordmark renditions matching the shapes you'd see on a physical card,
 * close enough that users instantly recognize the network at 32-48px.
 *
 * Brand colors sourced from each network's public brand guidelines as of
 * 2026 — kept inline so dark-mode foreground stays readable on whatever
 * card background the source happens to use.
 */

export type CardNetwork =
  | "visa"
  | "mastercard"
  | "amex"
  | "unionpay"
  | "jcb"
  | "discover";

export const CARD_NETWORK_LABELS: Record<CardNetwork, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  unionpay: "银联",
  jcb: "JCB",
  discover: "Discover",
};

export const CARD_NETWORK_VALUES: readonly CardNetwork[] = [
  "visa",
  "mastercard",
  "amex",
  "unionpay",
  "jcb",
  "discover",
];

/** Tiny prop set so all six logos type-check the same way. */
type LogoProps = SVGProps<SVGSVGElement>;

// ---------------------------------------------------------------------------
// Visa — blue + gold, "VISA" wordmark
// ---------------------------------------------------------------------------

function VisaLogo(props: LogoProps) {
  return (
    <svg viewBox="0 0 64 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="64" height="24" rx="3" fill="#1A1F71" />
      <text
        x="32"
        y="17"
        textAnchor="middle"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
        fontWeight="900"
        fontSize="14"
        fontStyle="italic"
        letterSpacing="1.5"
        fill="#fff"
      >
        VISA
      </text>
      <rect x="0" y="20" width="64" height="2" fill="#F7B600" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Mastercard — overlapping red + yellow circles
// ---------------------------------------------------------------------------

function MastercardLogo(props: LogoProps) {
  return (
    <svg viewBox="0 0 64 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="64" height="24" rx="3" fill="#fff" />
      <circle cx="26" cy="12" r="8" fill="#EB001B" />
      <circle cx="38" cy="12" r="8" fill="#F79E1B" />
      <path
        d="M32 6.5a8 8 0 0 0 0 11 8 8 0 0 0 0-11Z"
        fill="#FF5F00"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// American Express — blue square + "AMEX" wordmark
// ---------------------------------------------------------------------------

function AmexLogo(props: LogoProps) {
  return (
    <svg viewBox="0 0 64 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="64" height="24" rx="3" fill="#006FCF" />
      <text
        x="32"
        y="16"
        textAnchor="middle"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
        fontWeight="800"
        fontSize="9"
        letterSpacing="1.5"
        fill="#fff"
      >
        AMERICAN
      </text>
      <text
        x="32"
        y="23"
        textAnchor="middle"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
        fontWeight="800"
        fontSize="3"
        letterSpacing="0.5"
        fill="#fff"
      >
        EXPRESS
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// UnionPay — red/blue/green stripes + "UnionPay" / "银联"
// ---------------------------------------------------------------------------

function UnionPayLogo(props: LogoProps) {
  return (
    <svg viewBox="0 0 64 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="64" height="24" rx="3" fill="#fff" />
      <rect x="6" y="6" width="6" height="12" fill="#E21836" />
      <rect x="13" y="6" width="6" height="12" fill="#00447C" />
      <rect x="20" y="6" width="6" height="12" fill="#007B5F" />
      <text
        x="44"
        y="11"
        textAnchor="middle"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
        fontWeight="800"
        fontSize="6"
        fill="#00447C"
      >
        UnionPay
      </text>
      <text
        x="44"
        y="19"
        textAnchor="middle"
        fontFamily="'PingFang SC', 'Microsoft YaHei', sans-serif"
        fontWeight="700"
        fontSize="6"
        fill="#E21836"
      >
        银联
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// JCB — three-color stripes + "JCB" wordmark
// ---------------------------------------------------------------------------

function JcbLogo(props: LogoProps) {
  return (
    <svg viewBox="0 0 64 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="64" height="24" rx="3" fill="#fff" />
      {/* Three vertical color bars on the left */}
      <rect x="4" y="4" width="12" height="16" rx="2" fill="#0F4C9C" />
      <rect x="18" y="4" width="12" height="16" rx="2" fill="#D71F32" />
      <rect x="32" y="4" width="12" height="16" rx="2" fill="#0E833C" />
      {/* JCB letters cut out of bars (white) */}
      <text
        x="10"
        y="16"
        textAnchor="middle"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
        fontWeight="900"
        fontSize="9"
        fill="#fff"
      >
        J
      </text>
      <text
        x="24"
        y="16"
        textAnchor="middle"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
        fontWeight="900"
        fontSize="9"
        fill="#fff"
      >
        C
      </text>
      <text
        x="38"
        y="16"
        textAnchor="middle"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
        fontWeight="900"
        fontSize="9"
        fill="#fff"
      >
        B
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Discover — black wordmark with orange accent
// ---------------------------------------------------------------------------

function DiscoverLogo(props: LogoProps) {
  return (
    <svg viewBox="0 0 64 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="64" height="24" rx="3" fill="#fff" />
      <circle cx="51" cy="12" r="6" fill="#FF6000" />
      <text
        x="6"
        y="16"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
        fontWeight="700"
        fontSize="9"
        fill="#000"
      >
        DISC
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Public lookup
// ---------------------------------------------------------------------------

/**
 * Constant map (not a function) so callers do
 * `CARD_NETWORK_LOGOS[network]` in render — React 19's
 * react-hooks/static-components rule treats function-returning-component
 * calls as creating components in render, even when they're pure lookups.
 */
export const CARD_NETWORK_LOGOS: Record<CardNetwork, ComponentType<LogoProps>> = {
  visa: VisaLogo,
  mastercard: MastercardLogo,
  amex: AmexLogo,
  unionpay: UnionPayLogo,
  jcb: JcbLogo,
  discover: DiscoverLogo,
};
