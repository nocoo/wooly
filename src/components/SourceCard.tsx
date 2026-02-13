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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "credit-card": CreditCard,
  insurance: Shield,
  membership: Crown,
  telecom: Smartphone,
  other: Package,
};

export interface SourceCardProps {
  id: string;
  name: string;
  memberName: string;
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
  onClick?: () => void;
  onEdit?: () => void;
  onToggleArchive?: () => void;
  onDelete?: () => void;
}

export function SourceCard({
  name,
  memberName,
  categoryLabel,
  icon,
  phone,
  isExpired,
  isExpiringSoon,
  validUntilLabel,
  usedCount,
  totalCount,
  benefitCount,
  nextResetLabel,
  archived,
  onClick,
  onEdit,
  onToggleArchive,
  onDelete,
}: SourceCardProps) {
  const [faviconError, setFaviconError] = useState(false);
  const progressPercent =
    totalCount > 0 ? Math.round((usedCount / totalCount) * 100) : 0;

  // Resolve which icon to show
  const showFavicon = icon.type === "favicon" && !faviconError;
  const CategoryIcon =
    icon.type === "icon"
      ? CATEGORY_ICONS[icon.value] ?? Package
      : CATEGORY_ICONS[icon.value] ?? Package;

  return (
    <div
      className={cn(
        "rounded-card bg-secondary p-5 transition-colors",
        !archived && "hover:bg-secondary/80 cursor-pointer",
        archived && "opacity-60",
      )}
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
      {/* Header: icon + name/meta + menu */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0 overflow-hidden">
          {showFavicon ? (
            <Image
              src={`https://favicon.im/${icon.value}`}
              alt={`${name} favicon`}
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
              onError={() => setFaviconError(true)}
              unoptimized
            />
          ) : (
            <CategoryIcon className="h-5 w-5 text-primary" strokeWidth={1.5} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground truncate">
              {name}
            </p>
            {isExpired && (
              <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive shrink-0">
                已过期
              </span>
            )}
            {!isExpired && isExpiringSoon && (
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 shrink-0">
                即将到期
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {memberName} · {categoryLabel}
          </p>
        </div>
        {(onEdit || onToggleArchive || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
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

      {/* Phone */}
      {phone && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
          <Phone className="h-3 w-3" strokeWidth={1.5} />
          <span>{phone}</span>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-3">
        <div
          className="h-2 rounded-full bg-card"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${name}: ${usedCount}/${totalCount} 权益已使用`}
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPercent}%` }}
            aria-hidden="true"
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {usedCount}/{totalCount} 权益已使用 · 共 {benefitCount} 项
        </p>
      </div>

      {/* Footer: validity or next reset */}
      <div className="text-xs text-muted-foreground">
        {validUntilLabel ? (
          <span>有效期至 {validUntilLabel}</span>
        ) : nextResetLabel ? (
          <span>下次重置：{nextResetLabel}</span>
        ) : null}
      </div>
    </div>
  );
}
