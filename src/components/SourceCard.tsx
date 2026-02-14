"use client";

import { useState } from "react";
import Image from "next/image";
import type { SourceIconInfo } from "@/models/types";
import {
  CreditCard,
  Shield,
  Crown,
  Smartphone,
  Package,
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
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCardGradient, getCardProgressFill } from "@/lib/palette";

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
    overlayLarge: "bg-white/[0.04]",
    overlaySmall: "bg-white/[0.03]",
    textPrimary: "text-white",
    textSecondary: "text-white/80",
    textMuted: "text-white/50",
    progressTrack: "bg-white/15",
    progressFill: "bg-amber-300/80",
    chipHighContrast: true,
  },
  insurance: {
    gradient: "from-emerald-600 via-emerald-700 to-teal-800",
    overlayLarge: "bg-white/[0.06]",
    overlaySmall: "bg-white/[0.04]",
    textPrimary: "text-white",
    textSecondary: "text-white/80",
    textMuted: "text-white/50",
    progressTrack: "bg-white/15",
    progressFill: "bg-emerald-300/80",
    chipHighContrast: false,
  },
  membership: {
    gradient: "from-violet-600 via-purple-700 to-indigo-800",
    overlayLarge: "bg-white/[0.06]",
    overlaySmall: "bg-white/[0.04]",
    textPrimary: "text-white",
    textSecondary: "text-white/80",
    textMuted: "text-white/50",
    progressTrack: "bg-white/15",
    progressFill: "bg-violet-300/80",
    chipHighContrast: false,
  },
  telecom: {
    gradient: "from-sky-600 via-blue-700 to-blue-800",
    overlayLarge: "bg-white/[0.06]",
    overlaySmall: "bg-white/[0.04]",
    textPrimary: "text-white",
    textSecondary: "text-white/80",
    textMuted: "text-white/50",
    progressTrack: "bg-white/15",
    progressFill: "bg-sky-300/80",
    chipHighContrast: false,
  },
  other: {
    gradient: "from-zinc-600 via-zinc-700 to-zinc-800",
    overlayLarge: "bg-white/[0.05]",
    overlaySmall: "bg-white/[0.03]",
    textPrimary: "text-white",
    textSecondary: "text-white/80",
    textMuted: "text-white/50",
    progressTrack: "bg-white/15",
    progressFill: "bg-zinc-300/80",
    chipHighContrast: false,
  },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "credit-card": CreditCard,
  insurance: Shield,
  membership: Crown,
  telecom: Smartphone,
  other: Package,
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
  onClick?: () => void;
  onEdit?: () => void;
  onToggleArchive?: () => void;
  onDelete?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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
  onClick,
  onEdit,
  onToggleArchive,
  onDelete,
}: SourceCardProps) {
  const [faviconError, setFaviconError] = useState(false);
  const progressPercent =
    totalCount > 0 ? Math.round((usedCount / totalCount) * 100) : 0;

  const cs = CATEGORY_SCHEMES[category] ?? CATEGORY_SCHEMES.other;
  const CategoryIcon = CATEGORY_ICONS[category] ?? Package;
  const showFavicon = icon.type === "favicon" && !faviconError;

  // When colorIndex is set, use inline gradient styles; otherwise fall back to category scheme
  const hasCustomColor = colorIndex !== null && colorIndex >= 1 && colorIndex <= 24;
  const gradientStyle = hasCustomColor
    ? { background: getCardGradient(colorIndex) }
    : undefined;
  const progressFillStyle = hasCustomColor
    ? { width: `${progressPercent}%`, background: getCardProgressFill(colorIndex) }
    : { width: `${progressPercent}%` };

  return (
    <div
      className={cn(
        "aspect-[86/54] w-full rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-lg",
        !hasCustomColor && "bg-gradient-to-br",
        !hasCustomColor && cs.gradient,
        !archived && "cursor-pointer transition-shadow hover:shadow-xl",
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
          "absolute -top-12 -right-12 h-40 w-40 rounded-full",
          cs.overlayLarge,
        )}
      />
      <div
        className={cn(
          "absolute -bottom-8 -left-8 h-32 w-32 rounded-full",
          cs.overlaySmall,
        )}
      />

      {/* Top row: icon + name + menu */}
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 shrink-0 overflow-hidden">
            {showFavicon ? (
              <Image
                src={`https://favicon.im/${icon.value}`}
                alt={`${name} favicon`}
                width={20}
                height={20}
                className="h-5 w-5 object-contain"
                onError={() => setFaviconError(true)}
                unoptimized
              />
            ) : (
              <CategoryIcon
                className={cn("h-4.5 w-4.5", cs.textSecondary)}
                strokeWidth={1.5}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-sm font-semibold truncate",
                cs.textPrimary,
              )}
            >
              {name}
            </p>
            <p className={cn("text-[10px] mt-0.5", cs.textMuted)}>
              {memberName} · {categoryLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Status badges */}
          {isExpired && (
            <span className="inline-flex items-center rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-200">
              已过期
            </span>
          )}
          {!isExpired && isExpiringSoon && (
            <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-200">
              即将到期
            </span>
          )}

          {/* Contactless icon */}
          <NfcIcon
            className={cn("h-5 w-5", cs.textMuted)}
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
                    "h-7 w-7 shrink-0 hover:bg-white/10",
                    cs.textMuted,
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
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
                    className="text-destructive focus:text-destructive"
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

      {/* Middle: card number + progress bar + stats */}
      <div className="relative z-10 space-y-2">
        {cardNumber && (
          <p className={cn("text-base font-mono tracking-[0.25em]", cs.textPrimary)}>
            •••• {cardNumber}
          </p>
        )}
        <div
          className={cn("h-1.5 rounded-full", cs.progressTrack)}
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
        <p className={cn("text-xs font-mono tracking-wide", cs.textSecondary)}>
          {usedCount}/{totalCount} 已使用 · 共 {benefitCount} 项权益
        </p>
      </div>

      {/* Bottom row: validity + phone + category icon */}
      <div className="flex items-end justify-between relative z-10">
        <div className="flex gap-6">
          {validUntilLabel && (
            <div>
              <p className={cn("text-[9px] uppercase", cs.textMuted)}>
                有效期至
              </p>
              <p className={cn("text-xs font-mono", cs.textSecondary)}>
                {validUntilLabel}
              </p>
            </div>
          )}
          {phone && (
            <div>
              <p className={cn("text-[9px] uppercase", cs.textMuted)}>
                客服电话
              </p>
              <div className={cn("flex items-center gap-1", cs.textSecondary)}>
                <Phone className="h-3 w-3" strokeWidth={1.5} />
                <p className="text-xs font-mono">{phone}</p>
              </div>
            </div>
          )}
          {costLabel && (
            <div>
              <p className={cn("text-[9px] uppercase", cs.textMuted)}>
                维护成本
              </p>
              <p className={cn("text-xs font-mono", cs.textSecondary)}>
                {costLabel}
              </p>
            </div>
          )}
        </div>
        <div className={cs.textPrimary}>
          <CategoryIcon className="h-6 w-6" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}
