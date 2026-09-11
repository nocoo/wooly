"use client";

import type { LucideIcon } from "lucide-react";
import { LayerCard, Button } from "@nocoo/basalt";
import { cn } from "@/lib/utils";

export interface ActionItem {
  icon: LucideIcon;
  label: string;
  colorClassName: string;
  onClick?: () => void;
}

export interface ActionGridCardProps {
  title: string;
  icon: LucideIcon;
  actions: ActionItem[];
  className?: string;
}

export function ActionGridCard({
  title,
  icon: HeaderIcon,
  actions,
  className,
}: ActionGridCardProps) {
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
        <div className="flex-1 grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              onClick={action.onClick}
              className="flex flex-col items-center justify-center gap-2 rounded-xl p-3 h-auto min-h-[80px]"
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  action.colorClassName,
                )}
              >
                <action.icon className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <span className="text-xs text-basalt-foreground font-normal">
                {action.label}
              </span>
            </Button>
          ))}
        </div>
      </LayerCard.Body>
    </LayerCard>
  );
}
