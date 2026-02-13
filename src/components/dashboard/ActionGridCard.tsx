"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
        <div className="flex-1 grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="flex flex-col items-center gap-2 rounded-widget bg-card p-3 hover:bg-accent transition-colors cursor-pointer"
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  action.colorClassName,
                )}
              >
                <action.icon className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <span className="text-xs text-foreground">{action.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
