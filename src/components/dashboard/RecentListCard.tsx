"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
    <Card
      className={cn(
        "h-full rounded-card border-0 bg-secondary shadow-none",
        className,
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeaderIcon
              className="h-4 w-4 text-muted-foreground"
              strokeWidth={1.5}
            />
            <CardTitle className="text-sm font-normal text-muted-foreground">
              {title}
            </CardTitle>
          </div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
            >
              查看全部
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col">
        <div className="flex flex-1 flex-col gap-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {emptyText}
            </p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    item.iconClassName,
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.sublabel}
                  </p>
                </div>
                {item.rightText && (
                  <span
                    className={cn(
                      "text-sm font-medium text-foreground",
                      item.rightClassName,
                    )}
                  >
                    {item.rightText}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
