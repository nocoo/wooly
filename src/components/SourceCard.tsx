"use client";

import { useState } from "react";
import type { SourceIconInfo } from "@/models/types";
import {
  Phone,
  MoreVertical,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  NfcIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
} from "@nocoo/basalt";
import { cn } from "@/lib/utils";
import { CATEGORY_ICONS } from "@/components/icons/source-category";
import {
  CARD_NETWORK_LOGOS,
  type CardNetwork,
} from "@/components/icons/card-network";
import { getCardGradient, getCardProgressFill, getCardTextScheme, COLOR_SCHEME_COUNT } from "@/lib/palette";

// ---------------------------------------------------------------------------
// Category visuals — gradient + text color scheme per category
// ---------------------------------------------------------------------------

interface CategoryColorScheme {
  gradient: string;
  overlayLarge: string;
  overlaySmall: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  progressTrack: string;
  progressFill: string;
  chipHighContrast: boolean;
}

const CATEGORY_SCHEMES: Record<string, CategoryColorScheme> = {
  "credit-card": {
    gradient: "from-slate-800 via-slate-900 to-slate-950",
    overlayLarge: "bg-white/[0.10]",
    overlaySmall: "bg-white/[0.07]",
    textPrimary: "text-white",
    textSecondary: "text-white/80",
    textMuted: "text-white/50",
    progressTrack: "bg-white/15",
    progressFill: "bg-amber-300/80",
    chipHighContrast: true,
  },
  insurance: {
    gradient: "from-emerald-600 via-emerald-700 to-teal-800",
    overlayLarge: "bg-white/[0.14]",
    overlaySmall: "bg-white/[0.09]",
    textPrimary: "text-white",
    textSecondary: "text-white/80",
    textMuted: "text-white/50",
    progressTrack: "bg-white/15",
    progressFill: "bg-emerald-300/80",
    chipHighContrast: false,
  },
  membership: {
    gradient: "from-violet-600 via-purple-700 to-indigo-800",
    overlayLarge: "bg-white/[0.14]",
    overlaySmall: "bg-white/[0.09]",
    textPrimary: "text-white",
    textSecondary: "text-white/80",
    textMuted: "text-white/50",
    progressTrack: "bg-white/15",
    progressFill: "bg-violet-300/80",
    chipHighContrast: false,
  },
  telecom: {
    gradient: "from-sky-600 via-blue-700 to-blue-800",
    overlayLarge: "bg-white/[0.14]",
    overlaySmall: "bg-white/[0.09]",
    textPrimary: "text-white",
    textSecondary: "text-white/80",
    textMuted: "text-white/50",
    progressTrack: "bg-white/15",
    progressFill: "bg-sky-300/80",
    chipHighContrast: false,
  },
  other: {
    gradient: "from-zinc-600 via-zinc-700 to-zinc-800",
    overlayLarge: "bg-white/[0.12]",
    overlaySmall: "bg-white/[0.08]",
    textPrimary: "text-white",
    textSecondary: "text-white/80",
    textMuted: "text-white/50",
    progressTrack: "bg-white/15",
    progressFill: "bg-zinc-300/80",
    chipHighContrast: false,
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SourceCardProps {
  id: string;
  name: string;
  memberName: string;
  category: string;
  categoryLabel: string;
  icon: SourceIconInfo;
  phone: string | null;
  currency: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  validUntilLabel: string | null;
  usedCount: number;
  totalCount: number;
  benefitCount: number;
  nextResetLabel: string | null;
  archived: boolean;
  costLabel: string | null;
  cardNumber: string | null;
  colorIndex: number | null;
  cardNetwork: string | null;
  onClick?: () => void;
  onEdit?: () => void;
  onToggleArchive?: () => void;
  onDelete?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function NetworkLogoBadge({ cardNetwork }: { cardNetwork: CardNetwork }) {
  const NetworkLogo = CARD_NETWORK_LOGOS[cardNetwork];
  return (
    <NetworkLogo
      className="h-8 w-auto"
      aria-label={`${cardNetwork} card network`}
    />
  );
}

export function SourceCard({
  name,
  memberName,
  category,
  categoryLabel,
  icon,
  phone,
  isExpired,
  isExpiringSoon,
  validUntilLabel,
  usedCount,
  totalCount,
  benefitCount,
  archived,
  costLabel,
  cardNumber,
  colorIndex,
  cardNetwork,
  onClick,
  onEdit,
  onToggleArchive,
  onDelete,
}: SourceCardProps) {
  const [faviconError, setFaviconError] = useState(false);
  const progressPercent =
    totalCount > 0 ? Math.round((usedCount / totalCount) * 100) : 0;

  const cs = CATEGORY_SCHEMES[category] ?? CATEGORY_SCHEMES.other;
  const CategoryIcon = CATEGORY_ICONS[category] ?? CATEGORY_ICONS.other;
  const showFavicon = icon.type === "favicon" && !faviconError;

  // When colorIndex is set, use inline gradient styles; otherwise fall back to category scheme
  const hasCustomColor = colorIndex !== null && colorIndex >= 1 && colorIndex <= COLOR_SCHEME_COUNT;
  const isWhiteCard = hasCustomColor && colorIndex >= 31 && colorIndex <= 36;
  const gradientStyle = hasCustomColor
    ? { background: getCardGradient(colorIndex) }
    : undefined;

  // Black card variants (25-30) and white card variants (31-36) carry custom
  // text + decoration + progress colors via inline styles.
  const textScheme = hasCustomColor ? getCardTextScheme(colorIndex) : null;
  const textPrimaryStyle = textScheme ? { color: textScheme.textPrimary } : undefined;
  const textSecondaryStyle = textScheme ? { color: textScheme.textSecondary } : undefined;
  const textMutedStyle = textScheme ? { color: textScheme.textMuted } : undefined;
  const decorLargeStyle = textScheme ? { background: textScheme.decorOverlayLarge } : undefined;
  const decorSmallStyle = textScheme ? { background: textScheme.decorOverlaySmall } : undefined;
  const progressTrackStyle = textScheme ? { background: textScheme.progressTrack } : undefined;

  const progressFillStyle = hasCustomColor
    ? { width: `${progressPercent}%`, background: getCardProgressFill(colorIndex) }
    : { width: `${progressPercent}%` };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: role="button" + tabIndex + onKeyDown provide equivalent keyboard/AT semantics; switching to <button> breaks the card gradient/aspect layout
    <div
      className={cn(
        "aspect-[86/54] w-full rounded-2xl p-basalt-card relative overflow-hidden flex flex-col",
        !hasCustomColor && "bg-gradient-to-br",
        !hasCustomColor && cs.gradient,
        // White cards need a soft ring to keep their boundary visible on the
        // L1 page background (which is also near-white in light mode).
        isWhiteCard && "ring-1 ring-black/[0.06] shadow-sm",
        !archived && "cursor-pointer",
        archived && "opacity-60",
      )}
      style={gradientStyle}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
    >
      {/* Decorative circles */}
      <div
        className={cn(
          "absolute -top-16 -right-16 h-52 w-52 rounded-full",
          !textScheme && cs.overlayLarge,
        )}
        style={decorLargeStyle}
      />
      <div
        className={cn(
          "absolute -bottom-10 -left-10 h-40 w-40 rounded-full",
          !textScheme && cs.overlaySmall,
        )}
        style={decorSmallStyle}
      />

      {/* Top row: icon + name + menu */}
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 shrink-0 overflow-hidden">
            {showFavicon ? (
              <img
                src={`https://favicon.im/${icon.value}`}
                alt={`${name} favicon`}
                width={24}
                height={24}
                className="h-6 w-6 object-contain"
                onError={() => setFaviconError(true)}
              />
            ) : (
              <CategoryIcon
                className={cn("h-5 w-5", cs.textSecondary)}
                style={textSecondaryStyle}
                strokeWidth={1.5}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-base font-semibold truncate",
                cs.textPrimary,
              )}
              style={textPrimaryStyle}
            >
              {name}
            </p>
            <p className={cn("text-xs mt-1", cs.textMuted)} style={textMutedStyle}>
              {memberName} · {categoryLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Status badges */}
          {isExpired && (
            <span className="inline-flex items-center rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-medium text-red-200">
              已过期
            </span>
          )}
          {!isExpired && isExpiringSoon && (
            <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-200">
              即将到期
            </span>
          )}

          {/* Contactless icon */}
          <NfcIcon
            className={cn("h-6 w-6", cs.textMuted)}
            style={textMutedStyle}
            strokeWidth={1.5}
          />

          {/* Menu */}
          {(onEdit || onToggleArchive || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 shrink-0 hover:bg-white/10",
                    cs.textMuted,
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    编辑
                  </DropdownMenuItem>
                )}
                {onToggleArchive && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleArchive();
                    }}
                  >
                    {archived ? (
                      <>
                        <ArchiveRestore className="h-4 w-4 mr-2" />
                        取消归档
                      </>
                    ) : (
                      <>
                        <Archive className="h-4 w-4 mr-2" />
                        归档
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="text-basalt-destructive focus:text-basalt-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="mt-auto space-y-3">
        {/* Middle: card number + progress bar + stats */}
        <div className="relative z-10 space-y-2">
          {cardNumber && (
            <p className={cn("text-lg font-mono tracking-[0.25em]", cs.textPrimary)} style={textPrimaryStyle}>
              •••• {cardNumber}
            </p>
          )}
          <div
            className={cn("h-2 rounded-full", !textScheme && cs.progressTrack)}
            style={progressTrackStyle}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${name}: ${usedCount}/${totalCount} 权益已使用`}
          >
            <div
              className={cn("h-full rounded-full transition-all", !hasCustomColor && cs.progressFill)}
              style={progressFillStyle}
              aria-hidden="true"
            />
          </div>
          <p className={cn("text-sm font-mono tracking-wide tabular-nums", cs.textSecondary)} style={textSecondaryStyle}>
            {usedCount}/{totalCount} 已使用 · 共 {benefitCount} 项权益
          </p>
        </div>

        {/* Bottom row: validity + phone + category icon */}
        <div className="flex items-end justify-between relative z-10">
          <div className="flex gap-basalt-layout-lg">
            {validUntilLabel && (
              <div>
                <p className={cn("text-[10px] uppercase", cs.textMuted)} style={textMutedStyle}>
                  有效期至
                </p>
                <p className={cn("text-sm font-mono", cs.textSecondary)} style={textSecondaryStyle}>
                  {validUntilLabel}
                </p>
              </div>
            )}
            {phone && (
              <div>
                <p className={cn("text-[10px] uppercase", cs.textMuted)} style={textMutedStyle}>
                  客服电话
                </p>
                <div className={cn("flex items-center gap-1", cs.textSecondary)} style={textSecondaryStyle}>
                  <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <p className="text-sm font-mono">{phone}</p>
                </div>
              </div>
            )}
            {costLabel && (
              <div>
                <p className={cn("text-[10px] uppercase", cs.textMuted)} style={textMutedStyle}>
                  维护成本
                </p>
                <p className={cn("text-sm font-mono", cs.textSecondary)} style={textSecondaryStyle}>
                  {costLabel}
                </p>
              </div>
            )}
          </div>
          <div className={cs.textPrimary} style={textPrimaryStyle}>
            {cardNetwork && (CARD_NETWORK_LOGOS as Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>)[cardNetwork] ? (
              <NetworkLogoBadge cardNetwork={cardNetwork as CardNetwork} />
            ) : (
              <CategoryIcon className="h-8 w-8" strokeWidth={1.5} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
