"use client";

import type { LucideIcon } from "lucide-react";
import { LayerCard, Button } from "@nocoo/basalt";
import { cn } from "@/lib/utils";

export interface RecentListItem {
  id: string;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  iconClassName: string;
  rightText?: string;
  rightClassName?: string;
}

export interface RecentListCardProps {
  title: string;
  icon: LucideIcon;
  items: RecentListItem[];
  onViewAll?: () => void;
  emptyText?: string;
  className?: string;
}

export function RecentListCard({
  title,
  icon: HeaderIcon,
  items,
  onViewAll,
  emptyText = "暂无数据",
  className,
}: RecentListCardProps) {
  return (
    <LayerCard className={cn("h-full flex flex-col", className)}>
      <LayerCard.Header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeaderIcon
            className="h-4 w-4 text-basalt-muted-foreground"
            strokeWidth={1.5}
          />
          <span className="text-sm font-normal text-basalt-muted-foreground">
            {title}
          </span>
        </div>
        {onViewAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="text-xs text-basalt-muted-foreground hover:text-basalt-foreground h-auto p-0"
          >
            查看全部
          </Button>
        )}
      </LayerCard.Header>
      <LayerCard.Body className="flex-1 flex flex-col">
        <div className="flex flex-1 flex-col gap-3">
          {items.length === 0 ? (
            <p className="text-sm text-basalt-muted-foreground text-center py-4">
              {emptyText}
            </p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    item.iconClassName,
                  )}
                >
                  <item.icon className="h-4 w-4" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-basalt-foreground truncate">
                    {item.label}
                  </p>
                  <p className="text-xs text-basalt-muted-foreground truncate">
                    {item.sublabel}
                  </p>
                </div>
                {item.rightText && (
                  <span
                    className={cn(
                      "text-xs font-medium tabular-nums shrink-0",
                      item.rightClassName ?? "text-basalt-muted-foreground",
                    )}
                  >
                    {item.rightText}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </LayerCard.Body>
    </LayerCard>
  );
}
