"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ListItem {
  id: string;
  label: string;
  value: string;
  extra?: string;
  extraClassName?: string;
  valueClassName?: string;
}

export interface ItemListCardProps {
  title: string;
  icon: LucideIcon;
  items: ListItem[];
  emptyText?: string;
  className?: string;
}

export function ItemListCard({
  title,
  icon: HeaderIcon,
  items,
  emptyText = "暂无数据",
  className,
}: ItemListCardProps) {
  return (
    <Card
      className={cn(
        "h-full rounded-card border-0 bg-secondary shadow-none",
        className,
      )}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <HeaderIcon
            className="h-4 w-4 text-muted-foreground"
            strokeWidth={1.5}
          />
          <CardTitle className="text-sm font-normal text-muted-foreground">
            {title}
          </CardTitle>
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
              <div
                key={item.id}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-foreground">{item.label}</span>
                <div className="text-right">
                <span
                  className={cn(
                    "text-sm font-medium text-foreground font-display",
                    item.valueClassName,
                  )}
                >
                  {item.value}
                </span>
                  {item.extra && (
                    <span
                      className={cn(
                        "text-xs ml-2",
                        item.extraClassName ?? "text-success",
                      )}
                    >
                      {item.extra}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
