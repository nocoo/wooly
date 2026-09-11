"use client";

import type { LucideIcon } from "lucide-react";
import { LayerCard } from "@nocoo/basalt";
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
    <LayerCard className={cn("h-full flex flex-col", className)}>
      <LayerCard.Header className="flex items-center gap-2">
        <HeaderIcon
          className="h-4 w-4 text-basalt-muted-foreground"
          strokeWidth={1.5}
        />
        <span className="text-sm font-normal text-basalt-muted-foreground">
          {title}
        </span>
      </LayerCard.Header>
      <LayerCard.Body className="flex-1 flex flex-col">
        <div className="flex flex-1 flex-col gap-3">
          {items.length === 0 ? (
            <p className="text-sm text-basalt-muted-foreground text-center py-4">
              {emptyText}
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-basalt-foreground">{item.label}</span>
                <div className="text-right">
                  <span
                    className={cn(
                      "text-sm font-medium text-basalt-foreground font-display",
                      item.valueClassName,
                    )}
                  >
                    {item.value}
                  </span>
                  {item.extra && (
                    <span
                      className={cn(
                        "ml-2 text-xs text-basalt-muted-foreground font-display",
                        item.extraClassName,
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
      </LayerCard.Body>
    </LayerCard>
  );
}
