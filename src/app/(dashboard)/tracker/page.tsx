"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  CalendarCheck,
  TrendingUp,
  BarChart3,
  Ticket,
  ClipboardList,
  Plus,
  Zap,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { useTrackerViewModel } from "@/viewmodels/useTrackerViewModel";
import { StatCardWidget, StatGrid } from "@/components/dashboard/StatCardWidget";
import { RecentListCard } from "@/components/dashboard/RecentListCard";
import type { RecentListItem } from "@/components/dashboard/RecentListCard";
import { ActionGridCard } from "@/components/dashboard/ActionGridCard";
import type { ActionItem } from "@/components/dashboard/ActionGridCard";
import { RedeemDialog } from "@/components/RedeemDialog";
import type { RedeemDialogMember } from "@/components/RedeemDialog";
import { BenefitStatusBadge } from "@/components/BenefitStatusBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function TrackerPage() {
  const router = useRouter();
  const vm = useTrackerViewModel();

  const [redeemTarget, setRedeemTarget] = useState<{
    benefitId: string;
    benefitName: string;
    sourceName: string;
    sourceMemberId: string;
    type: "quota" | "credit" | "action";
    statusLabel: string;
  } | null>(null);

  // Map StatCard[] icons
  const statIcons = [CalendarCheck, TrendingUp, BarChart3];

  // Map RedemptionLogItem[] → RecentListItem[]
  const logItems: RecentListItem[] = vm.recentRedemptions.slice(0, 10).map((r) => ({
    id: r.id,
    label: `${r.benefitName} · ${r.memberName}`,
    sublabel: `${r.redeemedAt.slice(0, 10)} · ${r.sourceName}`,
    icon: CheckCircle,
    iconClassName: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    rightText: r.memo ?? undefined,
  }));

  // Quick actions
  const quickActions: ActionItem[] = [
    {
      icon: Ticket,
      label: "核销",
      colorClassName: "bg-primary/10 text-primary",
      onClick: () => {
        // Scroll to redeemable list
        document.getElementById("redeemable-list")?.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      icon: ClipboardList,
      label: "查看账户",
      colorClassName: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
      onClick: () => router.push("/sources"),
    },
    {
      icon: Plus,
      label: "添加账户",
      colorClassName: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
      onClick: () => router.push("/sources"),
    },
    {
      icon: Zap,
      label: "仪表盘",
      colorClassName: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
      onClick: () => router.push("/"),
    },
  ];

  // Map members → RedeemDialogMember[]
  const redeemMembers: RedeemDialogMember[] = vm.members.map((m) => ({
    id: m.id,
    name: m.name,
  }));

  const handleRedeem = (memberId: string, memo?: string) => {
    if (redeemTarget) {
      vm.redeem(redeemTarget.benefitId, memberId, memo);
      toast.success(`已核销：${redeemTarget.benefitName}`);
      setRedeemTarget(null);
    }
  };

  const handleUndo = (redemptionId: string, benefitName: string) => {
    vm.undoRedemption(redemptionId);
    toast.success(`已撤销：${benefitName}`);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Row 1: StatGrid */}
      <StatGrid columns={3}>
        {vm.stats.map((stat, i) => (
          <StatCardWidget
            key={stat.label}
            title={stat.label}
            value={stat.value}
            icon={statIcons[i]}
          />
        ))}
      </StatGrid>

      {/* Row 2: Recent log + Quick actions (2:1) */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <RecentListCard
            title="核销日志"
            icon={ClipboardList}
            items={logItems}
            emptyText="暂无核销记录"
          />
          {/* Undo buttons for recent redemptions */}
          {vm.recentRedemptions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {vm.recentRedemptions.slice(0, 3).map((r) => (
                <Button
                  key={r.id}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => handleUndo(r.id, r.benefitName)}
                >
                  <Undo2 className="h-3 w-3 mr-1" />
                  撤销「{r.benefitName}」
                </Button>
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-1">
          <ActionGridCard
            title="快捷操作"
            icon={Zap}
            actions={quickActions}
          />
        </div>
      </div>

      {/* Row 3: Redeemable benefits list */}
      <div id="redeemable-list" className="space-y-3">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          可核销权益
        </h3>
        {vm.redeemableBenefits.length === 0 ? (
          <div className="rounded-card bg-secondary p-6 text-center text-sm text-muted-foreground">
            暂无可核销的权益
          </div>
        ) : (
          vm.redeemableBenefits.map((item) => (
            <div
              key={item.id}
              className="rounded-widget bg-secondary p-3 md:p-4"
            >
              {/* Header: name + source + status badge + redeem button */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground truncate">
                    {item.benefitName}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {item.sourceName}
                  </span>
                  <BenefitStatusBadge
                    status={item.isExpiringSoon ? "expiring_soon" : "available"}
                  />
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  {item.isExpiringSoon && (
                    <span className="text-xs text-amber-600">
                      {item.daysUntilEnd}天后过期
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-primary hover:text-primary"
                    onClick={() =>
                      setRedeemTarget({
                        benefitId: item.id,
                        benefitName: item.benefitName,
                        sourceName: item.sourceName,
                        sourceMemberId: item.sourceMemberId,
                        type: item.type,
                        statusLabel: item.statusLabel,
                      })
                    }
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    核销
                  </Button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-card">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      item.isExpiringSoon ? "bg-amber-500" : "bg-primary",
                    )}
                    style={{ width: `${Math.min(item.progressPercent, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {item.statusLabel}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Redeem Dialog */}
      {redeemTarget && (
        <RedeemDialog
          open={!!redeemTarget}
          onOpenChange={(open) => {
            if (!open) setRedeemTarget(null);
          }}
          benefitName={redeemTarget.benefitName}
          sourceName={redeemTarget.sourceName}
          benefitType={redeemTarget.type}
          statusLabel={redeemTarget.statusLabel}
          defaultMemberId={redeemTarget.sourceMemberId}
          members={redeemMembers}
          onConfirm={handleRedeem}
        />
      )}
    </div>
  );
}
