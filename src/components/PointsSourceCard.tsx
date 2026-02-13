"use client";

import {
  Coins,
  MoreVertical,
  Pencil,
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

export interface PointsSourceCardProps {
  id: string;
  name: string;
  memberName: string;
  balance: number;
  affordableCount: number;
  totalRedeemables: number;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function PointsSourceCard({
  name,
  memberName,
  balance,
  affordableCount,
  totalRedeemables,
  onClick,
  onEdit,
  onDelete,
  className,
}: PointsSourceCardProps) {
  return (
    <div
      className={cn(
        "rounded-card bg-secondary p-5 hover:bg-secondary/80 transition-colors cursor-pointer",
        className,
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
      {/* Header: icon + name + menu */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 shrink-0">
          <Coins className="h-5 w-5 text-amber-600" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {name}
          </p>
          <p className="text-xs text-muted-foreground">
            {memberName} · 积分
          </p>
        </div>
        {(onEdit || onDelete) && (
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

      {/* Balance */}
      <div className="mb-3">
        <p className="text-2xl font-semibold text-foreground font-display tracking-tight">
          {balance.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">积分余额</p>
      </div>

      {/* Redeemables info */}
      <div className="text-xs text-muted-foreground">
        可兑换 {affordableCount}/{totalRedeemables} 项
      </div>
    </div>
  );
}
